#!/usr/bin/env node
/**
 * Aspiration complète du site Espace mondial l'atlas (version en ligne générée
 * par le backoffice) vers un dossier local, à l'identique.
 *
 * Usage : node tools/crawl.mjs [dossier-de-sortie]   (défaut : ./mirror)
 *
 * - Part des pages d'accueil FR/EN, des pages globales, et de TOUTES les
 *   ressources publiées listées par l'API de recherche (aucune page orpheline).
 * - Suit href/src/srcset/poster/data-*, les url() des CSS et des styles inline.
 * - Ne sort jamais du domaine, ignore /backend.
 * - Enregistre chaque fichier sous son chemin décodé (celui que nginx sert).
 * - Écrit mirror-report.json (URLs en erreur, nombre de fichiers, poids).
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ORIGIN = 'https://espace-mondial-atlas.sciencespo.fr'
const OUT = path.resolve(process.argv[2] || 'mirror')
const CONCURRENCY = 6

const seeds = [
  '/fr/', '/en/', '/fr/index.html', '/en/index.html',
  '/fr/not-found.html', '/en/not-found.html', '/not-found.html',
  '/assets/index.css', '/assets/img/favicon.ico',
  '/assets/js/eatlas.js', '/assets/js/eatlas.es5.js',
  '/assets/viz-home-bg-720p.mp4', '/assets/viz-home-bg-poster.jpg',
]

const queue = []
const seen = new Set()
const errors = []
const saved = []

const normalize = (raw, base) => {
  if (!raw) return null
  raw = raw.trim()
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(raw)) return null
  let u
  try {
    u = new URL(raw, base)
  } catch {
    return null
  }
  if (u.origin !== ORIGIN && !(u.hostname === 'espace-mondial-atlas.sciencespo.fr')) return null
  if (u.pathname.startsWith('/backend')) return null
  return u.pathname // query string & hash dropped (site statique)
}

const enqueue = (p) => {
  if (!p || seen.has(p)) return
  seen.add(p)
  queue.push(p)
}

const localPath = (p) => {
  let decoded
  try {
    decoded = decodeURIComponent(p)
  } catch {
    decoded = p
  }
  if (decoded.endsWith('/')) decoded += 'index.html'
  return path.join(OUT, decoded)
}

const extractFromHtml = (html, base) => {
  const out = []
  const attrRe = /\s(?:href|src|poster|data-src|data-href|data-url|data-search-page-url|content)\s*=\s*"([^"]*)"/gi
  for (const m of html.matchAll(attrRe)) out.push(m[1])
  const srcsetRe = /\s(?:srcset|data-srcset)\s*=\s*"([^"]*)"/gi
  for (const m of html.matchAll(srcsetRe)) {
    for (const part of m[1].split(',')) out.push(part.trim().split(/\s+/)[0])
  }
  out.push(...extractFromCss(html))
  return out.map((r) => normalize(r.replace(/&amp;/g, '&'), base)).filter(Boolean)
}

const extractFromCss = (css) => {
  const out = []
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) out.push(m[1])
  for (const m of css.matchAll(/@import\s+['"]([^'"]+)['"]/gi)) out.push(m[1])
  return out
}

const fetchOne = async (p) => {
  const url = ORIGIN + p
  let res
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, { redirect: 'manual' })
      break
    } catch (err) {
      if (attempt === 3) {
        errors.push({ path: p, error: String(err) })
        return
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location')
    errors.push({ path: p, status: res.status, location: loc })
    enqueue(normalize(loc, url))
    return
  }
  if (res.status !== 200) {
    errors.push({ path: p, status: res.status })
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const file = localPath(p)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, buf)
  saved.push({ path: p, bytes: buf.length })
  const type = res.headers.get('content-type') || ''
  if (type.includes('text/html') || file.endsWith('.html')) {
    extractFromHtml(buf.toString('utf8'), url).forEach(enqueue)
  } else if (type.includes('text/css') || file.endsWith('.css')) {
    extractFromCss(buf.toString('utf8')).map((r) => normalize(r, url)).forEach(enqueue)
  }
}

const apiSeeds = async () => {
  for (const lang of ['fr', 'en']) {
    const res = await fetch(`${ORIGIN}/backend/search?lang=${lang}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'size=5000',
    })
    const json = await res.json()
    for (const hit of json.hits) {
      enqueue(normalize(hit.url, ORIGIN))
      if (hit.preview) enqueue(normalize(hit.preview.url, ORIGIN))
    }
    console.log(`API ${lang}: ${json.hits.length}/${json.count} ressources`)
  }
}

seeds.forEach(enqueue)
await apiSeeds()

let active = 0
let done = 0
await new Promise((resolve) => {
  const pump = () => {
    while (active < CONCURRENCY && queue.length) {
      const p = queue.shift()
      active++
      fetchOne(p)
        .catch((err) => errors.push({ path: p, error: String(err) }))
        .finally(() => {
          active--
          done++
          if (done % 200 === 0) console.log(`${done} traités, ${queue.length} en attente`)
          if (!queue.length && !active) resolve()
          else pump()
        })
    }
  }
  pump()
})

const totalBytes = saved.reduce((s, f) => s + f.bytes, 0)
await fs.writeFile(
  path.join(path.dirname(OUT), 'mirror-report.json'),
  JSON.stringify({ date: new Date().toISOString(), files: saved.length, totalBytes, errors }, null, 2),
)
console.log(`Terminé : ${saved.length} fichiers, ${(totalBytes / 1e6).toFixed(1)} Mo, ${errors.length} erreurs`)
