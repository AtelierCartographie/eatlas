#!/usr/bin/env node
/**
 * À partir de data/external-check.json (tools/check-external.mjs), calcule les
 * remplacements de liens externes appliqués par le build :
 *   - lien mort (404/410, domaine disparu, erreur serveur persistante, ou
 *     redirection vers la page d'accueil du site) -> copie archivée sur la
 *     Wayback Machine la plus proche de la publication de l'atlas (2018) ;
 *   - lien http qui redirige simplement vers la même adresse en https -> https.
 * Écrit data/link-fixes.json { url: { to, reason } } et data/link-unresolved.json.
 * Usage : node tools/resolve-dead-links.mjs
 */
import fs from 'node:fs/promises'

const results = JSON.parse(await fs.readFile('data/external-check.json', 'utf8'))
const fixes = {}
const unresolved = {}

const DEAD_ERRORS = /ENOTFOUND|ECONNREFUSED|ERR_SSL_TLSV1_UNRECOGNIZED_NAME|EAI_AGAIN/
const isSoft404 = (url, r) => {
  if (r.status !== 200 || !r.final) return false
  const a = new URL(url)
  const b = new URL(r.final)
  return a.pathname.replace(/\/+$/, '') !== '' && b.pathname.replace(/\/+$/, '') === '' && !a.search
}
const isDead = (url, r) =>
  r.status === 404 || r.status === 410 || r.status >= 500 || (r.status === 0 && DEAD_ERRORS.test(r.error || '')) || isSoft404(url, r)

const wayback = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=20180901`)
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }
      const json = await res.json()
      const snap = json.archived_snapshots?.closest
      if (snap?.available && String(snap.status) === '200') return `https://web.archive.org/web/${snap.timestamp}/${url}`
      return null
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  return null
}

const dead = Object.entries(results).filter(([u, r]) => isDead(u, r))
let i = 0
const worker = async () => {
  while (i < dead.length) {
    const [url, r] = dead[i++]
    const reason = isSoft404(url, r) ? 'redirige vers l’accueil' : r.status ? `HTTP ${r.status}` : r.error
    const archived = await wayback(url)
    if (archived) fixes[url] = { to: archived, reason }
    else unresolved[url] = { reason, pages: r.pages }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))

for (const [url, r] of Object.entries(results)) {
  if (fixes[url] || unresolved[url]) continue
  if (r.status === 200 && url.startsWith('http://') && r.final) {
    const httpsUrl = 'https://' + url.slice(7)
    if (r.final.replace(/\/$/, '') === httpsUrl.replace(/\/$/, '')) fixes[url] = { to: r.final.endsWith('/') && !url.endsWith('/') ? httpsUrl : httpsUrl, reason: 'https' }
  }
}

await fs.writeFile('data/link-fixes.json', JSON.stringify(fixes, null, 1))
await fs.writeFile('data/link-unresolved.json', JSON.stringify(unresolved, null, 1))
const n = (re) => Object.values(fixes).filter((f) => re.test(f.reason)).length
console.log(`${dead.length} liens morts : ${Object.keys(fixes).length - n(/^https$/)} remplacés par une archive, ${Object.keys(unresolved).length} sans archive`)
console.log(`${n(/^https$/)} liens passés en https`)
