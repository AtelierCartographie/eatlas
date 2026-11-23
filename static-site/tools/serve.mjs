#!/usr/bin/env node
/**
 * Serveur local de test : sert dist/ comme le ferait un hébergement statique
 * (aucun code côté serveur), avec la page 404 du site selon la langue.
 * Usage : node tools/serve.mjs [port] [dossier]   (défaut : 8080 dist)
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = Number(process.argv[2]) || 8080
const ROOT = path.resolve(process.argv[3] || 'dist')
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

const send = (res, status, file) => {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

http
  .createServer((req, res) => {
    let p
    try {
      p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    } catch {
      p = '/'
    }
    let file = path.join(ROOT, p)
    if (!file.startsWith(ROOT)) file = ROOT
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!p.endsWith('/')) {
        res.writeHead(301, { Location: p + '/' })
        return res.end()
      }
      file = path.join(file, 'index.html')
    }
    if (fs.existsSync(file)) return send(res, 200, file)
    const notFound = p.startsWith('/en/') ? 'en/not-found.html' : 'fr/introuvable.html'
    console.log('404', p)
    send(res, 404, path.join(ROOT, notFound))
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}/ -> ${ROOT}`))
