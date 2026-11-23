#!/usr/bin/env node
/**
 * Vérifie les liens externes du site (data/external-links.json : url -> pages).
 * Écrit data/external-check.json : statut, URL finale après redirections.
 * Usage : node tools/check-external.mjs
 */
import fs from 'node:fs/promises'

const links = JSON.parse(await fs.readFile('data/external-links.json', 'utf8'))
const urls = Object.keys(links)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const results = {}

const check = async (url) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'fr,en' },
    })
    res.body?.cancel().catch(() => {})
    return { status: res.status, final: res.url }
  } catch (err) {
    return { status: 0, error: String(err.cause?.code || err.name || err) }
  } finally {
    clearTimeout(t)
  }
}

let i = 0
const worker = async () => {
  while (i < urls.length) {
    const url = urls[i++]
    let r = await check(url)
    if (r.status === 0 || r.status >= 500) r = await check(url) // 2e essai
    results[url] = { ...r, pages: links[url].length }
  }
}
await Promise.all(Array.from({ length: 12 }, worker))
await fs.writeFile('data/external-check.json', JSON.stringify(results, null, 1))
const by = {}
for (const r of Object.values(results)) by[r.status] = (by[r.status] || 0) + 1
console.log(urls.length, 'liens', by)
