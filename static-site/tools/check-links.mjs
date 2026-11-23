#!/usr/bin/env node
/**
 * Vérifie que TOUS les liens internes de dist/ pointent vers un fichier
 * existant (href, src, srcset, poster, url() CSS), et qu'aucune page ne
 * dépend encore du serveur d'origine (backend, backoffice, polyfill.io, UA).
 * Usage : node tools/check-links.mjs [dossier]   (défaut : dist)
 */
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.argv[2] || 'dist')
const walk = async (dir) => {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}
const decode = (s) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")

const files = await walk(ROOT)
const html = files.filter((f) => f.endsWith('.html'))
const css = files.filter((f) => f.endsWith('.css'))
const broken = new Map()
const forbidden = []
let checked = 0

const check = (from, raw) => {
  const url = unescape(raw.trim())
  if (!url || /^(#|mailto:|tel:|javascript:|data:|https?:|\/\/|<%)/i.test(url)) return
  const clean = url.replace(/[?#].*$/, '')
  if (!clean) return
  const target = clean.startsWith('/') ? path.join(ROOT, decode(clean)) : path.resolve(path.dirname(from), decode(clean))
  checked++
  let ok = existsSync(target)
  if (ok && clean.endsWith('/')) ok = existsSync(path.join(target, 'index.html'))
  if (!ok) {
    const key = path.relative(ROOT, target)
    if (!broken.has(key)) broken.set(key, [])
    broken.get(key).push(path.relative(ROOT, from))
  }
}

for (const f of html) {
  const src = await fs.readFile(f, 'utf8')
  if (/\/backend\/|\/backoffice\/|polyfill\.io|UA-2835049|data-api-url|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|jquery\/3\.3\.1|bootstrap\.custom\.min\.js/.test(src)) forbidden.push(path.relative(ROOT, f))
  // <link rel="alternate"> : hreflang et exports de citation (data: URI), non navigables
  const body = src.replace(/<link\b[^>]*\srel="alternate"[^>]*>/gi, '')
  for (const m of body.matchAll(/\s(?:href|src|poster|action|data-search-page-url)="([^"]*)"/gi)) check(f, m[1])
  for (const m of body.matchAll(/\ssrcset="([^"]*)"/gi)) m[1].split(',').forEach((p) => check(f, p.trim().split(/\s+/)[0]))
  for (const m of body.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) check(f, m[1])
  // Images d'affichage : WebP partout, JPEG seulement derrière un lien de téléchargement
  if (/-(small|medium|large)-[123]x\.jpe?g/.test(body.replace(/<a\b[^>]*\sdownload="[^"]*"[^>]*>/g, ''))) forbidden.push(path.relative(ROOT, f) + ' (JPEG affiché)')
  // Scripts intégrés : aucune ressource ne doit encore venir du serveur d'origine
  for (const m of body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/espace-mondial-atlas\.sciencespo\.fr\/(media|assets)\//.test(m[1])) forbidden.push(path.relative(ROOT, f) + ' (script)')
    for (const s of m[1].matchAll(/bgImg\.src = '([^']+)'/g)) check(f, s[1])
  }
}
for (const f of css) {
  const src = await fs.readFile(f, 'utf8')
  for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) check(f, m[1])
}

console.log(`${html.length} pages, ${css.length} CSS, ${checked} liens internes vérifiés`)
console.log(`${broken.size} cible(s) introuvable(s)`)
for (const [t, from] of broken) console.log(`  ✗ ${t}  (dans ${from.length} page(s), ex. ${from[0]})`)
console.log(`${forbidden.length} page(s) dépendant encore de l'ancien serveur`)
forbidden.slice(0, 10).forEach((f) => console.log('  ✗', f))
process.exit(forbidden.length || broken.size ? 1 : 0)
