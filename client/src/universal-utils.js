//@flow

const slugify = require('slugify')
slugify.extend({
  '’': '-',
  "'": '-',
  '"': '-',
})

// Utils used server-side or client-side, marked as "universal"
// They're all aliased in "utils" for client-side
// "preview" components must require "universal-utils" and not "utils"

exports.getDefinition = (
  dt /*: string*/,
  definitions /*: ?Array<Definition>*/,
  fullDefinitionObject = false,
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
  return fullDefinitionObject ? found : found ? found.dd : ''
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
  'Résumé-EN': 'summary-en',
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

exports.stripTags = (text /*: string */, whitelist /* string[] */ = []) =>
  (text || '').replace(
    /<\/?(.+?)(\s.+?)?>/g,
    (orig, tag) => (whitelist.includes(tag) ? orig : ''),
  )

exports.slugify = (text /*: string */) =>
  slugify(exports.stripTags(text), { lower: true })

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
  apiUrl /*: ?string */ = process.env.REACT_APP_API_SERVER,
  isFull = false,
) =>
  `${apiUrl || ''}/resources/${id}/file/${
    isFull ? 'full-' : ''
  }${size}-${density}`

exports.getResourcePagePreviewUrl = (
  resource /*: Resource */,
  apiUrl /*: ?string */ = process.env.REACT_APP_API_SERVER,
) => `${apiUrl || ''}/preview/resources/${resource.id}`

exports.topicName = (topic, lang) =>
  lang === 'fr' ? topic.name : topic[`name_${lang}`]
