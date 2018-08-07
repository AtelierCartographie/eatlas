//@flow

const slugify = require('slugify')

// Utils used server-side or client-side, marked as "universal"
// They're all aliased in "utils" for client-side
// "preview" components must require "universal-utils" and not "utils"

exports.getDefinition = (
  dt /*: string*/,
  definitions /*: ?Array<Definition>*/,
) /*: string*/ => {
  const search = dt.toLowerCase()
  if (!definitions) {
    return ''
  }
  const found = definitions.find(def => {
    if (def.dt.toLowerCase() === search) {
      // matches main definition
      return true
    }
    if (def.aliases && def.aliases.length) {
      // search in aliases
      return def.aliases.some(alias => alias.toLowerCase() === search)
    }
    return false
  })
  return found ? found.dd : ''
}

const getMeta = (article /*: Resource */, type /*: string */) =>
  (article.metas || []).find(m => m.type === type)
const getMetaList = (exports.getMetaList = (
  article /*: Resource */,
  type /*: string */,
) => {
  const found = getMeta(article, type)
  return (found && found.list) || []
})
const getMetaText = (exports.getMetaText = (
  article /*: Resource */,
  type /*: string */,
) => {
  const found = getMeta(article, type)
  return found ? found.text : null
})

const parseRelated = (exports.parseRelated = (string /*: string */) => {
  const match = string.match(/^\s*(.*?)\s*-\s*(.*?)\s*$/)
  const id = match && match[1]
  const text = match && match[2]
  return { id, text }
})

exports.getResourceIds = (
  article /*: Resource*/,
  onlyMandatory /*: ?boolean */ = false,
) /*: string[] */ =>
  [
    // Image header: mandatory
    getMetaText(article, 'image-header'),
    // Related article of a focus: mandatory
    getMetaText(article, 'related-article'),
    // Related resources: mandatory, except focus
    ...(article.nodes || [])
      .filter(node => node.type === 'resource')
      .map(node => node.id)
      .filter(
        id =>
          // mandatory only if not a focus
          !onlyMandatory || !id.match(/^\d+F.+$/),
      ),
    // Related articles ("see also"): optional
    ...(onlyMandatory
      ? []
      : getMetaList(article, 'related').map(
          ({ text }) => parseRelated(text).id,
        )),
  ].filter(Boolean)

// semantic agnostic
exports.META_CONVERSION = {
  // nodes
  h1: 'header',
  // metas
  auteur: 'author',
  partie: 'topic',
  identifiant: 'id',
  'Mots-clés': 'keywords',
  'Résumé-FR': 'summary-fr',
  "Continuer dans l'Atlas": 'related',
  'Continuer dans l’Atlas': 'related', // different apostrophe
  Références: 'references',
  // focus only
  'article-associé': 'related-article',
  'Image header': 'image-header',
}

exports.META_LIST_EXPECTED = ['keywords', 'references', 'related']

exports.LOCALES = {
  fr: 'Français',
  en: 'English',
}

exports.slugify = (text /*: string */) => slugify(text, { lower: true })

exports.getMediaUrl = (
  file /*: ?string */ = '',
  host /*: ?string */ = null,
) => {
  if (!host) {
    const root = process.env.REACT_APP_FRONT_URL || '/'
    const subpath = process.env.REACT_APP_MEDIA_SUBPATH || ''
    if (subpath) {
      const slash1 =
        root[root.length - 1] === '/' || subpath[0] === '/' ? '' : '/'
      host = root + slash1 + subpath
    }
  }

  host = host || ''
  file = file || ''
  const slash2 = host[host.length - 1] === '/' || file[0] === '/' ? '' : '/'
  return host + slash2 + file
}

exports.getMediaPreviewUrl = (
  id /*: string */,
  size /*: ResourceSize */,
  density /*: ResourceDensity */,
  host /*: ?string */ = process.env.REACT_APP_API_SERVER,
) => `${host || ''}/resources/${id}/file/${size}-${density}`

exports.getResourcePagePreviewUrl = (
  resource /*: Resource */,
  host /*: ?string */ = process.env.REACT_APP_API_SERVER,
) => `${host || ''}/preview/resources/${resource.id}`

// Common types (back/front)
exports.TYPES = {
  article: 'Article',
  focus: 'Focus',
  image: 'Photos',
  map: 'Cartes et graphiques',
  sound: 'Audio',
  video: 'Vidéos',
  definition: 'Lexique',
}

// Types that should appear on front side only: virtual type to now show in admin page
const types = (exports.CLIENT_TYPES = Object.assign({}, exports.TYPES, {
  'single-definition': 'Lexique',
  reference: 'Références',
}))
delete types.definition // Client only sees virtual 'single-definition' type

// { resourcesSlug, searchTypes, label }[]
exports.footerResourcesConfig = [
  { slug: 'maps-diagrams', types: ['map'], label: types.map },
  { slug: 'photos-videos', types: ['image'], label: `${types.image}` },
  { slug: 'focus', types: ['focus'], label: types.focus },
  { slug: 'lexique', page: ['lexicon'], label: types['single-definition'] },
]
