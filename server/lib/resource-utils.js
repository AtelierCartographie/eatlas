'use strict'

const { resources: Resources, topics: Topics } = require('./model')
const {
  getResourceIds,
  getMetaText,
  getMetaList,
} = require('../../client/src/universal-utils')

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
  related: getMetaList(article, 'related'),
})

exports.populateImageHeader = async article => {
  const imageHeaderId = getMetaText(article, 'image-header')
  return imageHeaderId ? Resources.findById(imageHeaderId) : null
}

exports.populateFocus = async (article, resources) => {
  return resources
    .filter(r => r.type === 'focus')
    .map(exports.flattenMetas)
    .find(f => f.relatedArticle === article.id)
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
  const lexicons = await exports.getTypeResources('definition')
  return lexicons.reduce(
    (definitions, lexicon) => definitions.concat(lexicon.definitions),
    [],
  )
}

exports.getArticles = async () => getTypeResources('article')

exports.getTopics = async () =>
  (await Topics.list()).sort((a, b) => a.id > b.id)

exports.getResource = async id => Resources.findById(id)
