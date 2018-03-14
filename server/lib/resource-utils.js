'use strict'

const {
  generateArticleHTML,
  generateFocusHTML,
  generateTopicHTML,
  generateResourceHTML,
} = require('./html-generator')
const { resources: Resources, topics: Topics } = require('./model')
const dynamicConfVar = require('./dynamic-config-variable')
const {
  getResourceIds,
  getMetaText,
  getMetaList,
} = require('../../client/src/universal-utils')

// reexports "enhanced" HTML generators

exports.generateArticleHTML = async (resource, options) => {
  const article = flattenMetas(resource)
  const topics = await getTopics()
  const definitions = await getDefinitions()
  let resources = await getResources(resource, !options || !options.preview)

  // need to retrieve imageHeader for "related" articles in footer since they're transitives deps
  resources = await Promise.all(
    resources.map(async r => {
      if (r.type === 'article') {
        r.imageHeader = await populateImageHeader(r)
      }
      return r
    }),
  )

  return generateArticleHTML(article, topics, definitions, resources, options)
}

exports.generateFocusHTML = async (resource, options) => {
  let focus = flattenMetas(resource)
  // to create the "go back to article" link
  focus.relatedArticleId = focus.relatedArticle
  focus.relatedArticle = await Resources.findById(focus.relatedArticle)
  const topics = await getTopics()
  const definitions = await getDefinitions()
  const resources = await getResources(resource, !options || !options.preview)

  return generateFocusHTML(focus, topics, definitions, resources, options)
}

exports.generateTopicHTML = async (topic, options) => {
  const resources = await getTopicResources(topic)
  const topics = await getTopics()
  const articles = await Promise.all(
    resources
      .filter(r => r.type === 'article')
      .map(flattenMetas)
      .map(async a => {
        a.imageHeader = await populateImageHeader(a)
        a.focus = await populateFocus(a, resources)
        return a
      }),
  )

  return generateTopicHTML(topic, topics, articles, resources, options)
}

exports.generateResourceHTML = async (resource, options) => {
  const topics = await getTopics()
  return generateResourceHTML(resource, topics, options)
}

// Article or Focus file name
exports.articleFileName = resource =>
  dynamicConfVar('htmlFileName.' + resource.type, resource)

// smoosh nested info to provide direct access in React components
const flattenMetas = article => ({
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

const populateImageHeader = async article => {
  const imageHeaderId = getMetaText(article, 'image-header')
  return imageHeaderId ? Resources.findById(imageHeaderId) : null
}

const populateFocus = async (article, resources) => {
  return resources
    .filter(r => r.type === 'focus')
    .map(flattenMetas)
    .find(f => f.relatedArticle === article.id)
}

const getNodeList = (article, type) => {
  const found = article.nodes.find(m => m.type === type)
  return (found && found.list) || []
}

const getTopicResources = async (topic /*, excludeUnpublished = false*/) => {
  // TODO handle query ES side
  return (await Resources.list()).filter(r => r.topic == topic.id)
}

const getResources = async (article, excludeUnpublished = false) => {
  const ids = getResourceIds(article)

  let filter = { terms: { id: ids } }
  if (excludeUnpublished) {
    filter = { bool: { must: [filter, { term: { status: 'published' } }] } }
  }

  return Resources.list({ query: { constant_score: { filter } } })
}

const getDefinitions = async () => {
  const lexicons = await Resources.list({
    query: { term: { type: 'definition' } },
  })
  return lexicons.reduce(
    (definitions, lexicon) => definitions.concat(lexicon.definitions),
    [],
  )
}

const getTopics = async () => (await Topics.list()).sort((a, b) => a.id > b.id)
