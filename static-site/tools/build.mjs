#!/usr/bin/env node
/**
 * Construit la version statique autonome d'Espace mondial l'atlas à partir de
 * l'aspiration du site d'origine (tools/crawl.mjs -> mirror/).
 *
 * Usage :
 *   node tools/build.mjs            -> dist/ (sans mesure d'audience, pour tests)
 *   node tools/build.mjs --prod     -> dist/ avec Google Tag Manager Sciences Po
 *
 * Ce que fait le build (le dossier mirror/ n'est jamais modifié) :
 *   1. copie mirror/ -> dist/ (sans les restes du backoffice) ;
 *   2. dans chaque page HTML :
 *      - retire Google Analytics UA (arrêté par Google en 2023) et le script
 *        cdn.polyfill.io (domaine compromis en 2024), injecte GTM si --prod ;
 *      - rend tous les liens internes RELATIFS (le site fonctionne quel que
 *        soit le domaine ou le sous-dossier où il est déposé) ; seules les
 *        métadonnées (og:*, hreflang) gardent l'URL absolue du site ;
 *      - corrige les liens cassés ou obsolètes (équipe, contact, backoffice) ;
 *      - met à jour les mentions légales (FR/EN) ;
 *      - branche la page de recherche sur l'index statique ;
 *   3. génère l'index de recherche (assets/search/*.json) ;
 *   4. ajoute index.html racine, robots.txt, sitemap.xml.
 */
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const MIRROR = path.join(ROOT, 'mirror')
const STATIC_SRC = path.join(ROOT, 'static-src')
const DATA = path.join(ROOT, 'data')
// Mots vides de l'ancien moteur : config/ du dépôt eatlas (dossier parent dans la
// branche static-site, ou clone src-repo/ à côté des outils)
const CONFIG_DIR = existsSync(path.join(ROOT, '..', 'config', 'stopwords-fr.json'))
  ? path.join(ROOT, '..', 'config')
  : path.join(ROOT, 'src-repo', 'config')
const PROD = process.argv.includes('--prod')
const OUT = path.join(ROOT, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'dist')

const SITE = 'https://espace-mondial-atlas.sciencespo.fr'
const SITE_RE = /^(?:https?:)?\/\/espace-mondial-atlas\.sciencespo\.fr/i
// Pages servies pour toute URL inconnue (404) : liens absolus depuis la racine
const ERROR_PAGES = new Set(['fr/introuvable.html', 'en/not-found.html'])
const BASE_PATH = '/' // chemin public du site, pour les seules pages 404

const GTM_ID = 'GTM-WFBGG7' // conteneur unique Sciences Po (cf. web-atelier/src/lib/config/analytics.js)
const GTM_HEAD = `<!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script><!-- End Google Tag Manager -->`
const GTM_BODY = `<!-- Google Tag Manager (noscript) --><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript><!-- End Google Tag Manager (noscript) -->`

const log = (...a) => console.log(...a)
const stats = {}
const count = (key, n = 1) => (stats[key] = (stats[key] || 0) + n)

/** Remplace et compte ; `expect` = nombre minimal attendu sur tout le site. */
const expectations = {}
const replaceCounted = (html, key, search, replacement) => {
  let n = 0
  const out = html.replace(search, (...m) => {
    n++
    return typeof replacement === 'function' ? replacement(...m) : replacement
  })
  if (n) count(key, n)
  return out
}

// ---------------------------------------------------------------- liens
const safeDecode = (s) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/**
 * Convertit une URL du site (absolue ou depuis la racine) en URL relative à
 * la page `pageRel` (ex. "fr/rubrique-mobilites/article-2A01.html").
 * Les URL externes, ancres et templates sont renvoyées telles quelles.
 */
const relativize = (url, pageRel, rootMode) => {
  let rest
  if (SITE_RE.test(url)) rest = url.replace(SITE_RE, '') || '/'
  else if (url.startsWith('/') && !url.startsWith('//')) rest = url
  else return url
  const m = rest.match(/^([^?#]*)(.*)$/)
  let p = m[1] || '/'
  const suffix = m[2]
  if (rootMode) return BASE_PATH + p.slice(1) + suffix
  const segs = p.slice(1).split('/')
  let last = segs.pop()
  if (last === '') last = 'index.html'
  const pageDirs = pageRel.split('/').slice(0, -1)
  let common = 0
  while (common < pageDirs.length && common < segs.length && safeDecode(segs[common]) === pageDirs[common]) common++
  const rel = '../'.repeat(pageDirs.length - common) + [...segs.slice(common), last].join('/')
  return rel + suffix
}

const URL_ATTRS = /(\s(?:href|src|poster|action|data-src|data-search-page-url|xlink:href)\s*=\s*")([^"]*)(")/gi
const SRCSET_ATTR = /(\s(?:srcset|data-srcset)\s*=\s*")([^"]*)(")/gi
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi

const rewriteLinks = (html, pageRel) => {
  const rootMode = ERROR_PAGES.has(pageRel)
  const rel = (u) => {
    const r = relativize(u, pageRel, rootMode)
    if (r !== u) count('liens internes rendus relatifs')
    return r
  }
  // Scripts intégrés : chargement progressif des grandes images d'en-tête
  // (bgImg.src = 'https://…/media/…') -> chemins relatifs eux aussi
  html = html.replace(/(<script\b(?![^>]*type="text\/html")[^>]*>)([\s\S]*?)(<\/script>)/g, (m, open, body, close) =>
    open + body.replace(/https?:\/\/espace-mondial-atlas\.sciencespo\.fr(\/(?:media|assets)\/[^'")\s]*)/g, (_, p) => {
      count('liens internes rendus relatifs (scripts)')
      return relativize(p, pageRel, rootMode)
    }) + close,
  )
  return html.replace(/<[a-zA-Z][^<>]*>/g, (tag) => {
    // Métadonnées : on garde les URL absolues (attendues par les moteurs)
    if (/^<link\b/i.test(tag) && /\srel="(?:alternate|canonical)"/i.test(tag)) return tag
    if (/^<meta\b/i.test(tag)) return tag
    return tag
      .replace(URL_ATTRS, (_, a, v, z) => a + rel(v) + z)
      .replace(SRCSET_ATTR, (_, a, v, z) =>
        a + v.split(',').map((part) => part.replace(/^(\s*)(\S+)/, (__, sp, u) => sp + rel(u))).join(',') + z,
      )
      .replace(CSS_URL, (_, q, u) => `url(${q}${rel(u)}${q})`)
  })
}

// ---------------------------------------------------------------- corrections
const LEGALS = {
  fr: {
    file: 'fr/mentions-legales.html',
    replace: [
      [
        '<p>Sciences Po<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07<br/>Tel. : 01 45 49 50 50<br/>Fax. : 01 42 22 31 26<br/>webmestre@sciencespo.fr</p>',
        '<p>Sciences Po (Fondation nationale des sciences politiques et Institut d’études politiques de Paris)<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07<br/>Tél. : +33 (0)1 45 49 50 50<br/><a href="mailto:carto@sciencespo.fr">carto@sciencespo.fr</a></p>',
      ],
      [
        '<p>Bénédicte Durand, administratrice provisoire de l’Institut d’études politiques de Paris et de la Fondation nationale des sciences politiques</p>',
        '<p>L’administrateur ou l’administratrice de la Fondation nationale des sciences politiques, directeur ou directrice de l’Institut d’études politiques de Paris (Sciences Po).</p>',
      ],
      [
        '<p>Ce site internet est hébergé par la Fondation Nationale des Sciences Politiques (FNSP)<br/>Sciences Po - Direction des Systèmes d&#x27;Information<br/>APE Code: 803Z<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07</p>',
        '<p>Ce site internet est hébergé par la Fondation nationale des sciences politiques (FNSP)<br/>Sciences Po – Direction du numérique<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07</p>' +
          '<h2>Données personnelles et mesure d’audience</h2>' +
          '<p>Ce site utilise Google Analytics, via Google Tag Manager, à des fins de mesure d’audience. Ce dispositif est commun à l’ensemble des sites de Sciences Po. Le dépôt des cookies de mesure d’audience est soumis à votre consentement, recueilli par le bandeau de gestion des cookies : vous pouvez l’accepter, le refuser ou modifier votre choix à tout moment.</p>' +
          '<p>Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous pouvez contacter le délégué à la protection des données de Sciences Po : <a href="mailto:dpo@sciencespo.fr">dpo@sciencespo.fr</a>.</p>',
      ],
    ],
  },
  en: {
    file: 'en/legals.html',
    replace: [
      [
        '<p>Sciences Po<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07<br/>Tel. : 01 45 49 50 50<br/>Fax. : 01 42 22 31 26<br/>webmestre@sciencespo.fr</p>',
        '<p>Sciences Po (Fondation nationale des sciences politiques and Institut d’études politiques de Paris)<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07, France<br/>Tel.: +33 (0)1 45 49 50 50<br/><a href="mailto:carto@sciencespo.fr">carto@sciencespo.fr</a></p>',
      ],
      [
        '<p>Bénédicte Durand, Interim Administrator of the Institut d’études politiques de Paris and the Fondation nationale des sciences politiques</p>',
        '<p>The Administrator of the Fondation nationale des sciences politiques and Director of the Institut d’études politiques de Paris (Sciences Po).</p>',
      ],
      [
        '<p>This website is hosted by Fondation Nationale des Sciences Politiques  (FNSP)<br/>Sciences Po - Direction des Systèmes d&#x27;Information<br/>APE Code: 803Z<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07</p>',
        '<p>This website is hosted by the Fondation nationale des sciences politiques (FNSP)<br/>Sciences Po – Direction du numérique<br/>27 rue Saint-Guillaume<br/>75337 Paris Cedex 07, France</p>' +
          '<h2>Personal data and audience measurement</h2>' +
          '<p>This website uses Google Analytics, through Google Tag Manager, for audience measurement. This setup is shared by all Sciences Po websites. Audience-measurement cookies are subject to your consent, collected via the cookie banner: you can accept, refuse or change your choice at any time.</p>' +
          '<p>For any question about your personal data or to exercise your rights, you may contact the Sciences Po Data Protection Officer: <a href="mailto:dpo@sciencespo.fr">dpo@sciencespo.fr</a>.</p>',
      ],
    ],
  },
}

const CONTACT_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdXV0kIyFtNLNn0y93HArh26sX3lVIAmLdxo0P4fhO8ZfHrVA/viewform'

/** Corrections appliquées à toutes les pages (avant la réécriture des liens). */
const fixContent = (html, pageRel) => {
  const lang = pageRel.startsWith('en/') ? 'en' : 'fr'
  // Mesure d'audience : retrait de Google Analytics UA (gtag), arrêté en juillet 2023
  html = replaceCounted(html, 'GA Universal Analytics retiré',
    /<script async="" src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=UA-[^"]*"><\/script><script>[\s\S]*?<\/script>/g, '')
  // cdn.polyfill.io : domaine racheté et compromis en 2024 (injection de code malveillant)
  html = replaceCounted(html, 'script polyfill.io retiré',
    /<script src="https:\/\/cdn\.polyfill\.io\/[^"]*"><\/script>/g, '')
  // Liens qui pointaient par erreur vers le backoffice
  html = replaceCounted(html, 'liens backoffice corrigés',
    /https:\/\/espace-mondial-atlas\.sciencespo\.fr\/backoffice\/resources\/1C(19|20)\/edit/g, 'https://www.itu.int')
  html = replaceCounted(html, 'liens backoffice corrigés',
    /https:\/\/espace-mondial-atlas\.sciencespo\.fr\/backoffice\/assets\/img\/sciences-po\.svg/g, '/assets/img/sciences-po.svg')
  // Équipe
  html = replaceCounted(html, 'équipe : lien Atelier de cartographie',
    /https:\/\/www\.sciencespo\.fr\/cartographie\/atelier-de-cartographie\//g, `https://www.sciencespo.fr/cartographie/${lang}`)
  html = replaceCounted(html, 'équipe : liens morts retirés (Academia / X D. Allès)',
    /<a href="http:\/\/u-pec\.academia\.edu\/DelphineAlles">Academia<\/a><a href="https:\/\/twitter\.com\/DelphineAlles">@DelphineAlles<\/a>/g, '')
  html = replaceCounted(html, 'équipe : Academia L. Maertens (nouvelle adresse)',
    /https:\/\/unil\.academia\.edu\/LucileMaertens/g, 'https://graduateinstitute.academia.edu/LucileMaertens')
  html = replaceCounted(html, 'équipe : twitter.com -> x.com',
    /https:\/\/twitter\.com\/(ThomasAnsart|MitranoP|antoinerio)"/g, (_, u) => `https://x.com/${u}"`)
  // Contact : les liens courts goo.gl ne sont plus maintenus par Google
  html = replaceCounted(html, 'contact : goo.gl -> Google Forms', /https:\/\/goo\.gl\/forms\/ei1BDbWq7CDQmwfL2/g, CONTACT_FORM)
  // Liens cassés déjà présents sur le site d'origine
  html = replaceCounted(html, 'accessibilité : lien photo 6P10 réparé',
    /https:\/\/espace-mondial-atlas\.sciencespo\.fr\/en\/topic-regulatory-efforts\/photo-6P10-EN-poubelles-de-recyclage-dans-le-centre-des-visiteurs-de-la-reserve-naturelle-de-paracas-dans-la-province-de-pisco-au-perou-fevrier-2016\.htm/g,
    '/fr/rubrique-tentatives-de-regulations/photo-6P10-poubelles-de-recyclage-dans-le-centre-des-visiteurs-de-la-reserve-naturelle-de-paracas-dans-la-province-de-pisco-au-perou-fevrier-2016.html')
  // L'image d'en-tête de la rubrique 0 n'a jamais existé (404) : rendu identique sans la requête
  html = replaceCounted(html, 'rubrique Introduction : image d’en-tête inexistante retirée',
    / style="background-image:url\(\/assets\/img\/headers\/topic-0\.png\)"/g, '')
  // http -> https
  html = replaceCounted(html, 'liens http -> https', /http:\/\/www\.(sciencespo\.fr\/|pressesdesciencespo\.fr\/)/g, (_, host) => `https://www.${host}`)
  // Mentions légales
  for (const legal of Object.values(LEGALS)) {
    if (legal.file !== pageRel) continue
    for (const [from, to] of legal.replace) {
      if (!html.includes(from)) throw new Error(`Mentions légales : bloc introuvable dans ${pageRel} :\n${from}`)
      html = html.replace(from, to)
      count('mentions légales : blocs mis à jour')
    }
  }
  // Librairies et polices servies depuis le site (plus de CDN ni de Google Fonts) ;
  // jQuery 3.3.1 -> 3.7.1 et Bootstrap 3.3.7 -> 3.4.1 (failles connues corrigées)
  for (const [key, from, to] of VENDOR) html = replaceCounted(html, key, from, to)
  // Bios de l'équipe : coquilles (FR) et traduction automatique fautive (EN)
  if (pageRel === 'en/about.html') html = useHomepageBios(html)
  for (const [from, to] of BIO_FIXES) html = replaceCounted(html, 'bios : coquilles corrigées', from, to)
  // Liens externes morts -> archive Wayback Machine ; http -> https quand le site redirige
  html = html.replace(/(<a\b[^>]*?\shref=")([^"]+)(")/g, (m, a, href, z) => {
    const fix = LINK_FIXES[decodeEntities(href)]
    if (!fix) return m
    count(fix.reason === 'https' ? 'liens externes : http -> https' : 'liens externes morts -> archive Wayback')
    return a + fix.to.replace(/&/g, '&amp;') + z
  })
  return html
}

const VENDOR = [
  ['vendor : jQuery 3.7.1 local', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery\/3\.3\.1\/jquery\.slim\.min\.js/g, '/assets/vendor/jquery.slim.min.js'],
  ['vendor : Bootstrap 3.4.1 local', /\/assets\/js\/bootstrap\.custom\.min\.js/g, '/assets/vendor/bootstrap-3.4.1.custom.js'],
  ['vendor : jasny-bootstrap local', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jasny-bootstrap\/3\.1\.3\/(?:css|js)\/(jasny-bootstrap\.min\.(?:css|js))/g, (_, f) => `/assets/vendor/${f}`],
  ['vendor : picturefill local', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/picturefill\/3\.0\.3\/picturefill\.min\.js/g, '/assets/vendor/picturefill.min.js'],
  ['vendor : slick local', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/slick-carousel\/1\.9\.0\/(slick(?:\.min\.js|\.css))/g, (_, f) => `/assets/vendor/${f}`],
  ['vendor : polices locales', /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css\?family=Fira\+Sans:300,300i,400,400i,700,700i"\/><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css\?family=Gentium\+Basic:400,400i,700,700i"\/>/g, '<link rel="stylesheet" href="/assets/vendor/fonts/fonts.css"/>'],
]

const BIO_FIXES = [
  // FR (accueil + à propos)
  ['<h3>Maîtresse de conférences en sience politique</h3>', '<h3>Maîtresse de conférences en science politique</h3>'],
  ['<p>Professeure de Science politique, Delphine Allès', '<p>Professeure de science politique, Delphine Allès'],
  ['l&#x27;Atlas de la mondialisation </p>', 'l&#x27;Atlas de la mondialisation.</p>'],
  ['Avec un soupcon de lignes', 'Avec un soupçon de lignes'],
  ['s&#x27;est notamment élargit au', 's&#x27;est notamment élargi au'],
  ['sa thèse de Doctorat', 'sa thèse de doctorat'],
  ['son équipe de traducteurs: Susan', 'son équipe de traducteurs : Susan'],
  // EN : contresens de la traduction automatique (sens aligné sur le texte français)
  ['The accompaniment of the establishment of the Department of Islamic Arts at the Louvre in 2012.', 'One project that left a mark on him? Supporting the creation of the Department of Islamic Arts at the Louvre in 2012.'],
  ['activities of International organisations', 'activities of international organisations'],
  ['<li>// Willing for free and open access</li>', '<li>// A commitment to free and open access</li>'],
  ['<li>// The extension of a flagship race at Sciences Po</li>', '<li>// An extension of a flagship course at Sciences Po</li>'],
  ['<li>// formats adapting to all media, including mobile</li>', '<li>// Formats adapting to all media, including mobile</li>'],
  ['<li>// The bet of a paper declination in the form of a beautiful book at the Presses de Sciences Po</li>', '<li>// A print edition, published as a fine book by the Presses de Sciences Po</li>'],
]

// La page « About » anglaise a gardé une traduction automatique des bios
// (« Mistress of conferences in political experience », « Lucine Maertens »…),
// alors que la page d'accueil anglaise en a une version relue : on la reprend.
let homepageBios = null
const useHomepageBios = (html) => {
  if (!homepageBios) {
    const home = require('node:fs').readFileSync(path.join(MIRROR, 'en/index.html'), 'utf8')
    homepageBios = new Map()
    for (const m of home.matchAll(/<h2>([^<]+)<\/h2><h3>[^<]*<\/h3>(?:<p>.*?<\/p>)?/g)) homepageBios.set(m[1], m[0])
  }
  return html.replace(/<h2>([^<]+)<\/h2><h3>[^<]*<\/h3>(?:<p>.*?<\/p>)?/g, (m, name) => {
    const bio = homepageBios.get(name)
    if (!bio || bio === m || !/<p>/.test(bio)) return m
    count('bios : page About EN alignée sur l’accueil')
    return bio
  })
}

// data/link-fixes.json : généré par tools/resolve-dead-links.mjs (archives, https)
// data/link-fixes-manual.json : adresses mal saisies dans les sources d'origine
const readJson = (f) => (existsSync(path.join(DATA, f)) ? JSON.parse(require('node:fs').readFileSync(path.join(DATA, f), 'utf8')) : {})
const LINK_FIXES = { ...readJson('link-fixes.json'), ...readJson('link-fixes-manual.json') }

// ---------------------------------------------------------------- images WebP
// Affichage en WebP (webp/, produit par tools/convert-webp.mjs) ; les fichiers proposés
// au téléchargement (<a download>) restent en JPEG d'origine, intacts.
const WEBP_DIR = path.join(ROOT, 'webp')
const isDisplayJpeg = (f) => /-(small|medium|large)-[123]x\.jpe?g$/.test(f) && !f.includes('-full-')
const DOWNLOAD_RE = /<a\b[^>]*\sdownload="[^"]*"[^>]*>/g

/** Fichiers de media/ cibles d'un lien de téléchargement, dans l'ensemble du site. */
const downloadTargets = async () => {
  const set = new Set()
  const scan = async (dir) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name !== 'media' && e.name !== 'backoffice') await scan(p)
      } else if (e.name.endsWith('.html')) {
        for (const [tag] of (await fs.readFile(p, 'utf8')).matchAll(DOWNLOAD_RE)) {
          const href = (tag.match(/\shref="[^"]*\/media\/([^"]+)"/) || [])[1]
          if (href) set.add(safeDecode(href))
        }
      }
    }
  }
  await scan(MIRROR)
  return set
}

const buildMedia = async () => {
  const src = path.join(MIRROR, 'media')
  const dest = path.join(OUT, 'media')
  if (!existsSync(src)) throw new Error('mirror/media/ absent : voir README (archive de la release)')
  await fs.mkdir(dest, { recursive: true })
  const downloads = await downloadTargets()
  const copy = (from, to) => fs.copyFile(from, to, require('node:fs').constants.COPYFILE_FICLONE)
  // 1. Toutes les images WebP (webp/). Permet aussi de reconstruire le site à partir de
  //    son archive, où les JPEG d'affichage n'existent plus.
  const webps = existsSync(WEBP_DIR) ? (await fs.readdir(WEBP_DIR)).filter((f) => f.endsWith('.webp')) : []
  for (const w of webps) {
    await copy(path.join(WEBP_DIR, w), path.join(dest, w))
    count('images : affichage en WebP')
  }
  const webpSet = new Set(webps)
  // 2. Fichiers d'origine : téléchargements (JPEG intacts), PNG ; JPEG d'affichage écartés
  const missing = []
  for (const f of await fs.readdir(src)) {
    if (f.startsWith('.') || f.endsWith('.webp')) continue
    if (isDisplayJpeg(f)) {
      if (!webpSet.has(f.replace(/\.jpe?g$/, '.webp'))) missing.push(f)
      if (!downloads.has(f)) continue
      count('images : JPEG conservé pour téléchargement')
    } else {
      count(f.includes('-full-') ? 'images : cartes à télécharger (JPEG d’origine)' : 'images : autres (PNG…) inchangées')
    }
    await copy(path.join(src, f), path.join(dest, f))
  }
  if (missing.length) throw new Error(`${missing.length} images sans WebP : lancer node tools/convert-webp.mjs (ex. ${missing[0]})`)
}

/** Références aux images d'affichage -> .webp, sauf dans les liens de téléchargement. */
const useWebp = (html) => {
  const kept = []
  html = html.replace(DOWNLOAD_RE, (m) => `\u0000${kept.push(m) - 1}\u0000`)
  html = replaceCounted(html, 'images : références passées en WebP',
    /(\/media\/[^"'\s(),]*-(?:small|medium|large)-[123]x)\.jpe?g/g, (_, p) => `${p}.webp`)
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)])
}

// ---------------------------------------------------------------- SEO
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const pageUrl = (rel) => `${SITE}/${rel.split('/').map((s) => encodeURIComponent(s).replace(/%28/g, '(').replace(/%29/g, ')')).join('/')}`

/** Résumé de secours : premier paragraphe du contenu, coupé à ~160 caractères. */
const firstParagraph = (html) => {
  const main = html.slice(Math.max(0, html.indexOf('<main')), html.indexOf('</main>') > 0 ? html.indexOf('</main>') : undefined)
  for (const m of main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
    if (text.length < 60) continue
    if (text.length <= 160) return text
    return text.slice(0, 157).replace(/\s+\S*$/, '') + '…'
  }
  return null
}

const seo = (html, pageRel) => {
  const lang = pageRel.startsWith('en/') ? 'en' : 'fr'
  const headEnd = html.indexOf('</head>')
  const head = html.slice(0, headEnd)
  const tags = []
  if (ERROR_PAGES.has(pageRel)) {
    tags.push('<meta name="robots" content="noindex"/>')
    count('SEO : pages 404 en noindex')
  } else {
    // Description (les moteurs n'utilisent pas og:description)
    let desc = (head.match(/<meta property="og:description" content="([^"]*)"/) || [])[1]
    if (!desc) {
      const p = firstParagraph(html)
      if (p) desc = escAttr(p)
    }
    if (!desc) {
      // Cartes, photos, rubriques sans texte : description construite sur le titre
      const title = decodeEntities((head.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/ - (Espace mondial : l'Atlas|World Atlas of Global Issues)$/, '').trim()
      const kind = path.basename(pageRel).split('-')[0]
      const label = {
        fr: { carte: 'Carte ou graphique', photo: 'Photo', rubrique: 'Rubrique', video: 'Vidéo', son: 'Son' },
        en: { map: 'Map or chart', photo: 'Photo', topic: 'Section', video: 'Video', sound: 'Audio' },
      }[lang][kind]
      if (title && label) {
        desc = escAttr(lang === 'fr'
          ? `${title} – ${label} d’Espace mondial : l’Atlas, atlas en libre accès de Sciences Po.`
          : `${title} – ${label} from the World Atlas of Global Issues, an open-access atlas by Sciences Po.`)
      }
    }
    if (desc) {
      tags.push(`<meta name="description" content="${desc}"/>`)
      count('SEO : meta description')
    }
    const canonical = pageUrl(pageRel)
    tags.push(`<link rel="canonical" href="${canonical}"/>`)
    count('SEO : canonical')
    // hreflang : auto-référence + x-default (version française)
    const other = head.match(/<link rel="alternate" href="(https?:\/\/[^"]+)" hrefLang="(fr|en)"\/>/)
    if (other) {
      tags.push(`<link rel="alternate" href="${canonical}" hrefLang="${lang}"/>`)
      tags.push(`<link rel="alternate" href="${lang === 'fr' ? canonical : other[1]}" hrefLang="x-default"/>`)
      count('SEO : hreflang complétés')
    }
  }
  tags.push(`<meta property="og:site_name" content="${lang === 'fr' ? 'Espace mondial : l’Atlas' : 'World Atlas of Global Issues'}"/>`)
  tags.push(`<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}"/>`)
  html = html.replace('</title>', `</title>${tags.join('')}`)
  html = replaceCounted(html, 'SEO : twitter:card corrigé', /<meta property="twitter:card"/g, '<meta name="twitter:card"')
  // Exports de citation : « data%3A » était lu comme un lien relatif (404 pour les
  // robots) et déclaré comme version linguistique (hrefLang) -> vrai data: URI, sans hrefLang
  html = replaceCounted(html, 'SEO : liens de citation réparés', /<link rel="alternate" href="data%3A([^"]*)"([^>]*)>/g, (_, rest, attrs) =>
    `<link rel="alternate" href="data:${rest}"${attrs.replace(/\shrefLang="[^"]*"/, '')}>`)
  return html
}

// ---------------------------------------------------------------- recherche
const SEARCH_PAGES = new Set(['fr/recherche.html', 'en/search.html'])
const wireSearchPage = (html, pageRel) => {
  if (!SEARCH_PAGES.has(pageRel)) return html
  const depth = pageRel.split('/').length - 1
  html = html.replace(/\sdata-api-url="[^"]*"/, '')
  const tag = `<script>window.EATLAS_ROOT=${JSON.stringify('../'.repeat(depth))};</script><script src="${'../'.repeat(depth)}assets/js/static-search.js"></script>`
  const marker = /<script src="[^"]*assets\/js\/eatlas\.es5\.js"><\/script>/
  if (!marker.test(html)) throw new Error(`${pageRel} : script eatlas.es5.js introuvable`)
  count('pages de recherche branchées sur l’index statique')
  return html.replace(marker, (m) => tag + m)
}

const patchFrontJs = async () => {
  const files = {
    'assets/js/eatlas.es5.js': [
      /var xhr = new XMLHttpRequest\(\);[\s\S]*?xhr\.send\(data\);/,
      `// Recherche statique (assets/js/static-search.js) : remplace l'ancienne API serveur
      window.EATLAS_SEARCH(data).then(function (json) {
        showSearchResults(json, formData);
      }, function (err) {
        showSearchError({ message: String(err && err.message || err) });
      });`,
    ],
    'assets/js/eatlas.js': [
      /const xhr = new XMLHttpRequest\(\)[\s\S]*?xhr\.send\(data\)/,
      `// Recherche statique (assets/js/static-search.js) : remplace l'ancienne API serveur
      window.EATLAS_SEARCH(data).then(
        json => showSearchResults(json, formData),
        err => showSearchError({ message: String((err && err.message) || err) }),
      )`,
    ],
  }
  for (const [file, [re, repl]] of Object.entries(files)) {
    const p = path.join(OUT, file)
    const src = await fs.readFile(p, 'utf8')
    if (!re.test(src)) throw new Error(`${file} : bloc XMLHttpRequest introuvable`)
    await fs.writeFile(p, src.replace(re, repl))
    count('scripts front patchés')
  }
  await fs.copyFile(path.join(STATIC_SRC, 'assets/js/static-search.js'), path.join(OUT, 'assets/js/static-search.js'))
}

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const pageText = (html) => {
  const i = html.indexOf('<main')
  const j = html.indexOf('</main>')
  const main = i >= 0 && j > i ? html.slice(i, j) : html
  return decodeEntities(
    main
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

const buildSearchIndex = async () => {
  // Fichier UMD destiné au navigateur : évalué ici comme un module CommonJS
  // (le package.json est en "type": "module", require() le lirait comme de l'ESM)
  const S = (() => {
    const module = { exports: {} }
    new Function('module', 'exports', require('node:fs').readFileSync(path.join(STATIC_SRC, 'assets/js/static-search.js'), 'utf8'))(module, module.exports)
    return module.exports
  })()
  const stopwordList = [
    ...JSON.parse(await fs.readFile(path.join(CONFIG_DIR, 'stopwords-fr.json'), 'utf8')),
    ...JSON.parse(await fs.readFile(path.join(CONFIG_DIR, 'stopwords-en.json'), 'utf8')),
  ]
    .filter((w) => !w.startsWith('//'))
    .map((w) => S.normalize(w).trim())
    .filter(Boolean)
  const stopwords = Object.fromEntries(stopwordList.map((w) => [w, true]))

  const all = JSON.parse(await fs.readFile(path.join(DATA, 'api-all-fr.json'), 'utf8'))
  const topicOf = new Map()
  for (let t = 0; t <= 6; t++) {
    const { hits } = JSON.parse(await fs.readFile(path.join(DATA, `api-topic-${t}.json`), 'utf8'))
    for (const h of hits) topicOf.set(h.url || `def:${h.title}`, t)
  }
  const toRootPath = (u) => (u ? safeDecode(u.replace(SITE_RE, '').replace(/^\//, '')) : null)
  const encodePath = (p) => (p ? p.split('/').map((s) => encodeURIComponent(s).replace(/%28/g, '(').replace(/%29/g, ')')).join('/') : null)

  const docs = []
  const text = []
  let missing = 0
  for (const hit of all.hits) {
    const filePath = toRootPath(hit.url)
    docs.push({
      title: hit.title,
      subtitle: hit.subtitle,
      type: hit.type,
      language: hit.language,
      topic: topicOf.has(hit.url || `def:${hit.title}`) ? topicOf.get(hit.url || `def:${hit.title}`) : null,
      url: encodePath(filePath),
      preview: hit.preview ? encodePath(toRootPath(hit.preview.url).replace(/(-(?:small|medium|large)-[123]x)\.jpe?g$/, '$1.webp')) : null,
      extra: hit.extra,
    })
    let body = ''
    let summary = hit.extra?.definition || ''
    if (filePath) {
      const f = path.join(OUT, filePath)
      if (existsSync(f)) {
        const html = await fs.readFile(f, 'utf8')
        body = pageText(html)
        // Résumé de la ressource (description_fr/_en dans l'ancien index)
        const og = html.match(/<meta property="og:description" content="([^"]*)"/)
        if (og) summary = decodeEntities(og[1])
      } else missing++
    }
    const titleToks = new Set(S.tokenize(`${hit.title} ${hit.subtitle || ''} ${(hit.extra?.aliases || []).join(' ')}`, stopwords))
    const descToks = new Set(S.tokenize(summary, stopwords).filter((t) => !titleToks.has(t)))
    const bodyToks = new Set(S.tokenize(body, stopwords).filter((t) => !titleToks.has(t) && !descToks.has(t)))
    text.push([[...titleToks].join(' '), [...descToks].join(' '), [...bodyToks].join(' ')])
  }
  if (missing) throw new Error(`Index de recherche : ${missing} pages de ressources absentes de l’aspiration`)
  const dir = path.join(OUT, 'assets/search')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ stopwords: Object.keys(stopwords), docs }))
  await fs.writeFile(path.join(dir, 'text.json'), JSON.stringify(text))
  count('ressources indexées pour la recherche', docs.length)
}

// ---------------------------------------------------------------- extras
const writeExtras = async (htmlFiles) => {
  await fs.writeFile(
    path.join(OUT, 'index.html'),
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Espace mondial : l'Atlas</title>` +
      `<meta http-equiv="refresh" content="0; url=fr/index.html"><link rel="canonical" href="${SITE}/fr/index.html">` +
      `<script>location.replace('fr/index.html' + location.hash)</script></head>` +
      `<body><p><a href="fr/index.html">Espace mondial : l’Atlas (français)</a> – <a href="en/index.html">World Atlas of Global Issues (English)</a></p></body></html>\n`,
  )
  const urls = htmlFiles
    .filter((f) => !ERROR_PAGES.has(f) && f !== 'index.html')
    .map((f) => `${SITE}/${f.split('/').map((s) => encodeURIComponent(s).replace(/%28/g, '(').replace(/%29/g, ')')).join('/')}`)
  await fs.writeFile(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}</loc></url>`).join('\n') +
      `\n</urlset>\n`,
  )
  await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
  count('pages dans sitemap.xml', urls.length)
}

// ---------------------------------------------------------------- main
const walk = async (dir, base = '') => {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...(await walk(path.join(dir, e.name), rel)))
    else out.push(rel)
  }
  return out
}

if (!existsSync(MIRROR)) throw new Error('Dossier mirror/ absent : lancer d’abord node tools/crawl.mjs')
log(`Build ${PROD ? 'PRODUCTION (GTM actif)' : 'local (sans mesure d’audience)'} -> ${path.relative(ROOT, OUT)}/`)
await fs.rm(OUT, { recursive: true, force: true })
// Copie rapide (clones APFS sur macOS, copie classique ailleurs), sans media/ : traité à part
await fs.mkdir(OUT, { recursive: true })
for (const entry of await fs.readdir(MIRROR)) {
  if (entry === 'media' || entry === 'backoffice') continue
  try {
    execFileSync('cp', ['-Rc', path.join(MIRROR, entry), OUT])
  } catch {
    execFileSync('cp', ['-R', path.join(MIRROR, entry), OUT])
  }
}
await buildMedia()
await fs.rm(path.join(OUT, 'backoffice'), { recursive: true, force: true })
await fs.rm(path.join(OUT, '.DS_Store'), { force: true })
// Librairies locales (remplacent cdnjs, Google Fonts et l'ancien Bootstrap 3.3.7)
execFileSync('cp', ['-R', path.join(STATIC_SRC, 'assets/vendor'), path.join(OUT, 'assets/vendor')])
await fs.rm(path.join(OUT, 'assets/js/bootstrap.custom.min.js'), { force: true })

const files = await walk(OUT)
const htmlFiles = files.filter((f) => f.endsWith('.html')).sort()
for (const rel of htmlFiles) {
  const file = path.join(OUT, rel)
  let html = await fs.readFile(file, 'utf8')
  html = fixContent(html, rel)
  html = useWebp(html)
  html = seo(html, rel)
  html = wireSearchPage(html, rel)
  html = rewriteLinks(html, rel)
  if (PROD) {
    html = html.replace(/<head>/, `<head>${GTM_HEAD}`).replace(/<body([^>]*)>/, `<body$1>${GTM_BODY}`)
    count('pages avec GTM')
  }
  await fs.writeFile(file, html)
  count('pages HTML traitées')
}
await patchFrontJs()
await buildSearchIndex()
await writeExtras(htmlFiles)

// Garde-fous : chaque correction attendue doit avoir été appliquée
const required = [
  'GA Universal Analytics retiré', 'script polyfill.io retiré', 'liens backoffice corrigés',
  'équipe : lien Atelier de cartographie', 'équipe : liens morts retirés (Academia / X D. Allès)',
  'équipe : Academia L. Maertens (nouvelle adresse)', 'équipe : twitter.com -> x.com',
  'contact : goo.gl -> Google Forms', 'pages de recherche branchées sur l’index statique',
  ...VENDOR.map(([k]) => k), 'bios : coquilles corrigées', 'bios : page About EN alignée sur l’accueil',
  'images : affichage en WebP', 'images : références passées en WebP',
  'SEO : meta description', 'SEO : canonical', 'SEO : hreflang complétés', 'SEO : liens de citation réparés',
]
const missingFixes = required.filter((k) => !stats[k])
if (stats['mentions légales : blocs mis à jour'] !== 6) missingFixes.push('mentions légales (6 blocs)')
for (const [k, v] of Object.entries(stats)) log(`  ${String(v).padStart(7)}  ${k}`)
if (missingFixes.length) {
  console.error('ÉCHEC — corrections non appliquées :', missingFixes)
  process.exit(1)
}
log('OK')
