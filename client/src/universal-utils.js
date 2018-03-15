//@flow

// Utils used server-side or client-side, marked as "universal"
// They're all aliased in "utils" for client-side
// "preview" components must require "universal-utils" and not "utils"

exports.getDefinition = (
  dt /*: string*/,
  definitions /*: ?Array<Definition>*/,
) /*: string*/ => {
  const search = dt.toLowerCase()
  if (!definitions) {
    return null
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
  return found && found.dd
}

const getMeta = (article, type) => article.metas.find(m => m.type === type)
const getMetaList = (exports.getMetaList = (article, type) => {
  const found = getMeta(article, type)
  return (found && found.list) || []
})
const getMetaText = (exports.getMetaText = (article, type) => {
  const found = getMeta(article, type)
  return found ? found.text : null
})

const parseRelated = (exports.parseRelated = string => {
  const match = string.match(/^\s*(.*?)\s*-\s*(.*?)\s*$/)
  const id = match && match[1]
  const text = match && match[2]
  return { id, text }
})

exports.getResourceIds = (article /*: Resource*/, onlyMandatory = false) =>
  [
    // Image header: mandatory
    getMetaText(article, 'image-header'),
    // Related article of a focus: mandatory
    getMetaText(article, 'related-article'),
    // Related resources: mandatory, except focus
    ...article.nodes
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
  ].filter(id => !!id)

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
  Références: 'references',
  // focus only
  'article-associé': 'related-article',
  'Image header': 'image-header',
}

// https://gist.github.com/mathewbyrne/1280286
exports.slugify = text =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text

exports.getMediaUrl = file => {
  const root =
    (process.env.REACT_APP_FRONT_URL || '/') +
    (process.env.REACT_APP_MEDIA_SUBPATH || '')
  const slash = root[root.length - 1] === '/' || file[0] === '/' ? '' : '/'
  return root + slash + file
}

// { resourcesSlug, searchTypes, label }[]
exports.footerResourcesConfig = [
  { slug: 'maps-diagrams', types: ['map'], label: 'Cartes et diagrammes' },
  {
    slug: 'photos-videos',
    types: ['image', 'video'],
    label: 'Photos et vidéos',
  },
  { slug: 'focus', types: ['focus'], label: 'Focus' },
  { slug: 'lexique', types: ['definition'], label: 'Lexique' },
  { slug: 'references', types: ['references'], label: 'Références' }, // virtual type
]
