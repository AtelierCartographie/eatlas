/*!
 * Espace mondial l'atlas — recherche statique (sans serveur).
 *
 * Remplace l'API de recherche Node/Elasticsearch (POST /backend/search) du
 * site d'origine. Les données sont pré-calculées au build (tools/build.mjs) :
 *   - assets/search/meta.json : métadonnées de chaque ressource (titre, type,
 *     langue, rubrique, URL, vignette…), dans l'ordre par défaut de l'ancienne
 *     API (date de publication décroissante), + mots vides FR/EN ;
 *   - assets/search/text.json : jetons normalisés (titre / résumé / corps),
 *     chargé seulement quand une recherche plein texte est lancée.
 *
 * Reproduit le comportement de server/lib/routes/search.js :
 *   filtres types[], locales[], topics[], letter, pagination de 10,
 *   plein texte « ET » sur tous les mots, tolérance d'une faute de frappe
 *   (fuzziness 1), pondération titre 40 / résumé 10 / corps 1.
 *
 * Fichier UMD : chargé tel quel par le navigateur (window.EATLAS_SEARCH) et
 * par le script de build Node (même tokenisation des deux côtés).
 */
;(function (root, factory) {
  var api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.EatlasSearch = api
    root.EATLAS_SEARCH = api.search
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  var PER_PAGE = 10
  var FIELD_WEIGHTS = [40, 10, 1] // titre, résumé/définition, corps
  var DEFAULT_TYPES = ['article', 'focus', 'map', 'sound', 'image', 'video', 'single-definition']

  // Minuscules, sans diacritiques, découpage sur tout ce qui n'est pas lettre/chiffre
  function normalize(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/œ/gi, 'oe')
      .replace(/æ/gi, 'ae')
      .toLowerCase()
  }

  function tokenize(str, stopwords) {
    var parts = normalize(str).split(/[^a-z0-9]+/)
    var out = []
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i]
      if (t.length < 2 && !/^[0-9]$/.test(t)) continue
      if (stopwords && stopwords[t]) continue
      out.push(t)
    }
    return out
  }

  // Distance d'édition ≤ 1 (insertion, suppression, substitution, transposition)
  function withinOneEdit(a, b) {
    var la = a.length
    var lb = b.length
    if (Math.abs(la - lb) > 1) return false
    if (la > lb) {
      var tmp = a; a = b; b = tmp
      la = a.length; lb = b.length
    }
    var i = 0
    while (i < la && a.charCodeAt(i) === b.charCodeAt(i)) i++
    if (i === la) return true // b = a + 1 caractère (ou égales)
    if (la === lb) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true // substitution
      // transposition de deux caractères adjacents
      return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
    }
    return a.slice(i) === b.slice(i + 1) // insertion
  }

  // ---------------------------------------------------------------- navigateur
  var state = { meta: null, text: null, vocab: null, stopwords: null }

  function rootUrl() {
    return (typeof window !== 'undefined' && window.EATLAS_ROOT) || '/'
  }

  function getJSON(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return
        if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
          try {
            resolve(JSON.parse(xhr.responseText))
          } catch (err) {
            reject(err)
          }
        } else {
          reject(new Error('Index de recherche indisponible (' + xhr.status + ')'))
        }
      }
      xhr.send()
    })
  }

  var metaPromise = null
  function loadMeta() {
    if (!metaPromise) {
      metaPromise = getJSON(rootUrl() + 'assets/search/meta.json').then(function (meta) {
        state.meta = meta
        state.stopwords = {}
        meta.stopwords.forEach(function (w) { state.stopwords[w] = true })
        return meta
      })
    }
    return metaPromise
  }

  var textPromise = null
  function loadText() {
    if (!textPromise) {
      textPromise = getJSON(rootUrl() + 'assets/search/text.json').then(function (text) {
        // Vocabulaire : jeton -> Map(doc -> masque des champs qui le contiennent).
        // L'index ne répète pas un mot dans plusieurs champs (titre > résumé >
        // corps) : les champs sont donc cumulatifs, un mot du titre compte aussi
        // pour le résumé et le corps (qui le contiennent dans la page).
        var vocab = new Map()
        var all = (1 << FIELD_WEIGHTS.length) - 1
        var titleLen = []
        for (var d = 0; d < text.length; d++) {
          titleLen.push(text[d][0] ? text[d][0].split(' ').length : 1)
          for (var f = 0; f < text[d].length; f++) {
            var toks = text[d][f] ? text[d][f].split(' ') : []
            var mask = all & ~((1 << f) - 1)
            for (var k = 0; k < toks.length; k++) {
              var tok = toks[k]
              var list = vocab.get(tok)
              if (!list) vocab.set(tok, (list = new Map()))
              list.set(d, (list.get(d) || 0) | mask)
            }
          }
        }
        state.titleLen = titleLen
        state.vocab = vocab
        state.vocabKeys = Array.from(vocab.keys())
        return vocab
      })
    }
    return textPromise
  }

  // Score plein texte : doc -> score.
  // Comme l'ancienne requête Elasticsearch (match « operator: and » sur chaque
  // champ, combinés en « should ») : un document est retenu si UN de ses champs
  // contient TOUS les mots ; chaque champ complet ajoute son poids.
  // La tolérance d'une faute (fuzziness 1) est limitée aux mots de 4 lettres et
  // plus (sinon « ONU » trouvait « on », « un », « nu »…).
  function fullTextScores(q) {
    var terms = tokenize(q, state.stopwords)
    if (!terms.length) terms = tokenize(q, null) // que des mots vides : requête brute
    if (!terms.length) return null
    var nFields = FIELD_WEIGHTS.length
    // Pour chaque mot : doc -> [qualité par champ] (1 exact, 0.5 approché)
    var perTerm = terms.map(function (term) {
      var hits = new Map()
      var add = function (tok, quality) {
        var postings = state.vocab.get(tok)
        if (!postings) return
        postings.forEach(function (mask, d) {
          var q = hits.get(d)
          if (!q) hits.set(d, (q = [0, 0, 0]))
          for (var f = 0; f < nFields; f++) if (mask & (1 << f) && q[f] < quality) q[f] = quality
        })
      }
      add(term, 1)
      if (term.length >= 4) {
        var keys = state.vocabKeys
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i]
          if (k !== term && withinOneEdit(term, k)) add(k, 0.5)
        }
      }
      return hits
    })
    var scores = new Map()
    perTerm[0].forEach(function (_, d) {
      var score = 0
      for (var f = 0; f < nFields; f++) {
        var fieldScore = 0
        for (var t = 0; t < perTerm.length; t++) {
          var q = perTerm[t].get(d)
          if (!q || !q[f]) { fieldScore = 0; break }
          fieldScore += q[f]
        }
        // Titre : un titre court qui contient la requête compte davantage
        // (équivalent de la normalisation par longueur de champ d'Elasticsearch)
        var norm = f === 0 ? 1 / Math.sqrt(state.titleLen[d]) : 1
        score += FIELD_WEIGHTS[f] * fieldScore * norm
      }
      if (score > 0) scores.set(d, score)
    })
    return scores
  }

  function search(queryString) {
    var params = new URLSearchParams(queryString || '')
    var q = (params.get('q') || '').trim()
    var page = Math.max(1, Number(params.get('page')) || 1)
    var size = Math.max(1, Number(params.get('size')) || PER_PAGE)
    var types = params.getAll('types[]')
    if (!types.length) types = DEFAULT_TYPES
    var locales = params.getAll('locales[]')
    var topics = params.getAll('topics[]').map(String)
    var letter = normalize(params.get('letter') || '')

    return loadMeta()
      .then(function () { return q ? loadText() : null })
      .then(function () {
        var docs = state.meta.docs
        var scores = q ? fullTextScores(q) : null
        var matches = []
        for (var i = 0; i < docs.length; i++) {
          var doc = docs[i]
          if (types.indexOf(doc.type) === -1) continue
          if (locales.length && locales.indexOf(doc.language) === -1) continue
          if (topics.length && (doc.topic === null || topics.indexOf(String(doc.topic)) === -1)) continue
          if (letter && normalize(doc.title).trim().charAt(0) !== letter) continue
          if (scores && !scores.has(i)) continue
          matches.push(i)
        }
        if (scores) {
          matches.sort(function (a, b) { return scores.get(b) - scores.get(a) || a - b })
        }
        var from = (page - 1) * size
        var pageItems = matches.slice(from, from + size)
        var root = rootUrl()
        return {
          start: from + 1,
          end: from + pageItems.length,
          count: matches.length,
          hits: pageItems.map(function (i) {
            var doc = docs[i]
            return {
              title: doc.title,
              subtitle: doc.subtitle,
              type: doc.type,
              language: doc.language,
              url: doc.url ? root + doc.url : undefined,
              preview: doc.preview ? { url: root + doc.preview } : null,
              extra: doc.extra || null,
            }
          }),
        }
      })
  }

  return {
    normalize: normalize,
    tokenize: tokenize,
    withinOneEdit: withinOneEdit,
    search: search,
    DEFAULT_TYPES: DEFAULT_TYPES,
  }
})
