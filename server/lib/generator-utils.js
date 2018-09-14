'use strict'

const config = require('config')
const { promisify } = require('util')
const imageSize = promisify(require('image-size'))
const { stat } = require('fs-extra')
const { basename } = require('path')

const { resources: Resources, topics: Topics } = require('./model')
const {
  getResourceIds,
  getMetaText,
  getMetaList,
  getMediaUrl,
  getMediaPreviewUrl,
  getResourcePagePreviewUrl,
} = require('../../client/src/universal-utils')
const {
  pathToUrl,
  pagePath,
  resourceMediaPath,
  getTypeLabel,
} = require('./resource-path')
const {
  getResourcePageUrl,
  getTopicPageUrl,
  globalPageUrl,
} = require('../../client/src/components/preview/layout')

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
  title: article.title || getMetaText(article, 'title'),
  summaries: {
    en: article.description_en || getMetaText(article, 'summary-en'),
    fr: article.description_fr || getMetaText(article, 'summary-fr'),
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
  if (!config.pageUrls[key || resource.type]) {
    return resource
  }
  if (!resource.pageUrl) {
    resource.pageUrl = preview
      ? getResourcePagePreviewUrl(resource, apiUrl)
      : pathToUrl(pagePath(key || resource.type, resource, topics))
  }
  return resource
}

exports.populateImageStats = async (resource, options) => {
  if (resource.images) {
    resource.imageStats = {}
    for (let size of ['small', 'medium', 'large']) {
      if (resource.images[size]) {
        for (let density of ['1x', '2x', '3x']) {
          if (resource.images[size][density]) {
            const found = {
              size,
              density,
              file: resource.images[size][density],
            }
            resource.imageStats[`${size}-${density}`] = await getImageStats(
              resource,
              found,
              options,
            )
          }
        }
      }
    }
  }
}

exports.populateImageRelatedResources = async resource => {
  resource.relatedResources = await Resources.list({
    query: {
      nested: {
        path: 'nodes',
        query: { term: { 'nodes.id.keyword': resource.id } },
      },
    },
  })
}

const humanSize = bytes => {
  let value = bytes
  let unit = 'o'
  if (value > 1000) {
    value /= 1000
    unit = 'Ko'
  }
  if (value > 1000) {
    value /= 1000
    unit = 'Mo'
  }
  if (value > 1000) {
    value /= 1000
    unit = 'Go'
  }
  if (value > 1000) {
    value /= 1000
    unit = 'To'
  }
  return `${Math.floor(value)} ${unit}` // eslint-disable-line no-irregular-whitespace
}

const getImageStats = async (resource, found, { preview = false } = {}) => {
  const paths = resourceMediaPath(resource.type, found.file, {
    up: true,
    pub: false,
    full: true,
  })
  const filePath = paths.upFull || paths.up
  const [{ width, height, type }, { size }] = await Promise.all([
    imageSize(filePath),
    stat(filePath),
  ])
  const url = preview
    ? getMediaPreviewUrl(
        resource.id,
        found.size,
        found.density,
        apiUrl,
        !!paths.upFull,
      )
    : getMediaUrl(basename(filePath), publicMediaUrl)
  return {
    width,
    height,
    type,
    size,
    humanSize: humanSize(size),
    filePath,
    url,
  }
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

exports.getTopicResources = async (topic, excludeUnpublished = false) => {
  let filter = { term: { topic: topic.id } }
  if (excludeUnpublished) {
    filter = { bool: { must: [filter, { term: { status: 'published' } }] } }
  }
  return Resources.list({
    query: { constant_score: { filter } },
    sort: [{ id: 'asc' }],
  })
}

exports.getArticleResources = async (article, excludeUnpublished = false) => {
  const ids = getResourceIds(article)

  let filter = { terms: { id: ids } }
  if (excludeUnpublished) {
    filter = { bool: { must: [filter, { term: { status: 'published' } }] } }
  }

  return Resources.list({ query: { constant_score: { filter } } })
}

const getTypeResources = async (type, sort = null) => {
  const body = { query: { term: { type } } }
  if (sort) {
    body.sort = sort
  }
  return await Resources.list(body)
}

exports.getDefinitions = async () => {
  const lexicons = await getTypeResources('definition')
  return lexicons.reduce(
    (definitions, lexicon) => definitions.concat(lexicon.definitions),
    [],
  )
}

exports.getArticles = async () =>
  await getTypeResources('article', { id: 'asc' })

exports.getTopics = async () =>
  (await Topics.list()).sort((a, b) => a.id > b.id)

exports.getResource = async id => {
  const found = await Resources.findById(id)
  if (!found && id === 'LEXIC') {
    // No lexicon uploaded: just go with a fake one with no definitions
    return { definitions: [] }
  }
  return found
}

// type Link = { url: string, title: string, info: string?, children: Link[] }
// @return Link[]
exports.getAllUrls = async options => {
  const topics = await exports.getTopics()
  // Urls tree
  const urls = []
  const getPageDescription = (
    title,
    key,
    { resource = null, hash = null, children = [], info = null } = {},
  ) => {
    const url = resource
      ? key === 'topic'
        ? getTopicPageUrl(resource, options)
        : getResourcePageUrl(resource, options)
      : globalPageUrl(key, null, hash)(options)
    children = children.map(args => getPageDescription(...args))
    return { url, title, info, children }
  }
  const addPage = (title, key, options) => {
    urls.push(getPageDescription(title, key, options))
  }
  // Global pages
  addPage('Accueil', 'index')
  addPage('Recherche', 'search')
  addPage('À propos', 'about', {
    children: [
      ['Le projet', 'about', { hash: 'project' }],
      ['L’équipe', 'about', { hash: 'team' }],
      ['Nous contacter', 'about', { hash: 'contact' }],
      ['Le livre', 'about', { hash: 'book' }],
    ],
  })
  addPage('Mentions légales', 'legals')
  // Topics & resources
  for (const topic of topics) {
    const resources = await exports.getTopicResources(topic, !options.preview)
    const children = resources.map(r => [
      r.title,
      r.type,
      {
        resource: r,
        info: `(${getTypeLabel(r)})`,
      },
    ])
    addPage(topic.name, 'topic', {
      resource: topic,
      children,
      info: '(rubrique)',
    })
  }
  return urls
}
