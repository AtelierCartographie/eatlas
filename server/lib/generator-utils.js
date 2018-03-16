'use strict'

const config = require('config')
const { resources: Resources, topics: Topics } = require('./model')
const {
  getResourceIds,
  getMetaText,
  getMetaList,
  getMediaUrl,
  getMediaPreviewUrl,
  getResourcePagePreviewUrl,
} = require('../../client/src/universal-utils')
const { pathToUrl, pagePath } = require('./resource-path')

const apiUrl = config.apiUrl
const publicMediaUrl =
  config.publicUrl +
  (config.publicUrl[config.publicUrl.length - 1] === '/' ||
  config.mediaSubPath[0] === '/'
    ? ''
    : '/') +
  config.mediaSubPath

// smoosh nested info to provide direct access in React components
exports.flattenMetas = article => ({
  ...article,
  imageHeader: getMetaText(article, 'image-header'),
  relatedArticle: getMetaText(article, 'related-article'),
  title: getMetaText(article, 'title'),
  summaries: {
    en: getMetaText(article, 'summary-en'),
    fr: getMetaText(article, 'summary-fr'),
  },
  keywords: getMetaList(article, 'keywords'),
  footnotes: getNodeList(article, 'footnotes'),
  references: getMetaList(article, 'references'),
  related: getMetaList(article, 'related'),
})

exports.getImageHeader = async article => {
  const imageHeaderId = getMetaText(article, 'image-header')
  return imageHeaderId ? Resources.findById(imageHeaderId) : null
}

exports.populateFocus = async (article, resources) => {
  return resources
    .filter(r => r.type === 'focus')
    .map(exports.flattenMetas)
    .find(f => f.relatedArticle === article.id)
}

exports.populatePageUrl = (
  key,
  topics,
  { preview = false } = {},
) => resource => {
  if (Array.isArray(resource)) {
    return resource.map(exports.populatePageUrl(key, topics, { preview }))
  }
  if (!resource.pageUrl) {
    resource.pageUrl = preview
      ? getResourcePagePreviewUrl(resource, apiUrl)
      : pathToUrl(pagePath(key || resource.type, resource, topics))
  }
  return resource
}

const smallestImageKey = images => {
  if (images) {
    for (let size of ['small', 'medium', 'large']) {
      if (images[size]) {
        for (let density of ['1x', '2x', '3x']) {
          if (images[size][density]) {
            return { size, density }
          }
        }
      }
    }
  }
  return null
}

exports.smallestImage = images => {
  const found = smallestImageKey(images)
  if (!found) {
    return null
  }
  return images[found.size][found.density]
}

const getThumbnailUrl = (resources, { preview }) => resource => {
  if (!resource) {
    return null
  }
  switch (resource.type) {
    case 'image':
    case 'map': {
      const found = smallestImageKey(resource.images)
      if (!found) {
        return null
      }
      if (preview) {
        return getMediaPreviewUrl(
          resource.id,
          found.size,
          found.density,
          apiUrl,
        )
      } else {
        return getMediaUrl(
          resource.images[found.size][found.density],
          publicMediaUrl,
        )
      }
    }
    case 'article': {
      const imageHeaderId = getMetaText(resource, 'image-header')
      const imageHeader = resources.find(({ id }) => id === imageHeaderId)
      return getThumbnailUrl(resources, { preview })(imageHeader)
    }
    case 'focus': {
      const relatedArticleId = getMetaText(resource, 'related-article')
      const relatedArticle = resources.find(({ id }) => id === relatedArticleId)
      return getThumbnailUrl(resources, { preview })(relatedArticle)
    }
    case 'sound': // TODO generic audio thumbnail?
    case 'video': // TODO video thumbnail?
    default:
      return null
  }
}

exports.populateThumbnailUrl = (
  resources,
  { preview = false } = {},
) => resource => {
  if (Array.isArray(resource)) {
    return resource.map(exports.populateThumbnailUrl(resources, { preview }))
  }
  if (!resource.thumbnailUrl) {
    resource.thumbnailUrl = getThumbnailUrl(resources, {
      preview,
    })(resource)
  }
  return resource
}

const getNodeList = (article, type) => {
  const found = article.nodes.find(m => m.type === type)
  return (found && found.list) || []
}

exports.getTopicResources = async (topic /*, excludeUnpublished = false*/) => {
  // TODO handle query ES side
  return (await Resources.list()).filter(r => r.topic == topic.id)
}

exports.getArticleResources = async (article, excludeUnpublished = false) => {
  const ids = getResourceIds(article)

  let filter = { terms: { id: ids } }
  if (excludeUnpublished) {
    filter = { bool: { must: [filter, { term: { status: 'published' } }] } }
  }

  return Resources.list({ query: { constant_score: { filter } } })
}

const getTypeResources = async type =>
  Resources.list({ query: { term: { type } } })

exports.getDefinitions = async () => {
  const lexicons = await getTypeResources('definition')
  return lexicons.reduce(
    (definitions, lexicon) => definitions.concat(lexicon.definitions),
    [],
  )
}

exports.getArticles = async () =>
  (await getTypeResources('article')).sort((a, b) => a.id > b.id)

exports.getTopics = async () =>
  (await Topics.list()).sort((a, b) => a.id > b.id)

exports.getResource = async id => Resources.findById(id)
