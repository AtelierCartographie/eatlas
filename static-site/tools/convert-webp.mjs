#!/usr/bin/env node
/**
 * Convertit en WebP les images d'AFFICHAGE du site (mirror/media/*.jpeg) vers webp/.
 *
 * - Concerne les déclinaisons {small,medium,large}-{1,2,3}x.jpeg (affichage, vignettes,
 *   images de partage). Les cartes « full » (fichiers à télécharger) ne sont pas
 *   converties : elles restent en JPEG d'origine.
 * - Les PNG restent tels quels (le WebP sans perte n'y gagne que ~6 %).
 * - WebP qualité 82 : aucune différence visible sur les cartes (texte, légendes),
 *   −45 % de poids en moyenne. Le WebP est lu par tous les navigateurs depuis 2020 et
 *   par les robots des réseaux sociaux (contrairement à l'AVIF).
 * - Incrémental : une image déjà convertie et plus récente que sa source est sautée.
 *
 * Usage : npm install && node tools/convert-webp.mjs   (≈ 15-30 min la première fois)
 */
import fs from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'mirror/media')
const OUT = path.join(ROOT, 'webp')
export const WEBP_OPTIONS = { quality: 82, effort: 6, smartSubsample: true }
export const isDisplayJpeg = (f) => /-(small|medium|large)-[123]x\.jpe?g$/.test(f) && !f.includes('-full-')

if (!existsSync(SRC)) throw new Error('mirror/media/ absent : voir README (archive de la release)')
await fs.mkdir(OUT, { recursive: true })
sharp.concurrency(1)

const files = (await fs.readdir(SRC)).filter(isDisplayJpeg).sort()
let i = 0
let done = 0
let skipped = 0
let before = 0
let after = 0
const worker = async () => {
  while (i < files.length) {
    const f = files[i++]
    const src = path.join(SRC, f)
    const dest = path.join(OUT, f.replace(/\.jpe?g$/, '.webp'))
    if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) {
      skipped++
    } else {
      await sharp(src).webp(WEBP_OPTIONS).toFile(dest)
      done++
    }
    before += statSync(src).size
    after += statSync(dest).size
    if ((done + skipped) % 250 === 0) console.log(`${done + skipped}/${files.length}`)
  }
}
await Promise.all(Array.from({ length: Math.max(2, os.cpus().length - 2) }, worker))
console.log(`${files.length} images : ${done} converties, ${skipped} déjà à jour`)
console.log(`JPEG ${(before / 1e6).toFixed(0)} Mo -> WebP ${(after / 1e6).toFixed(0)} Mo (${((1 - after / before) * 100).toFixed(0)} % de moins)`)
