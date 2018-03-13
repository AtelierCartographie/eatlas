'use strict'

const { generateArticleHTML, generateFocusHTML } = require('./html-generator')
const { resources: Resources, topics: Topics } = require('./model')
const dynamicConfVar = require('./dynamic-config-variable')

exports.generateArticleHTML = async (resource, options) => {
  const article = flattenMetas(resource)
  const topics = (await Topics.list()).sort((a, b) => a.id > b.id)
  const definitions = await getDefinitions()
  let resources = await getResources(resource, !options || !options.preview)

  // need to retrieve imageHeader for "related" articles in footer since they transitives deps
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
  const article = flattenMetas(resource)
  const topics = (await Topics.list()).sort((a, b) => a.id > b.id)
  const definitions = await getDefinitions()
  let resources = await getResources(resource, !options || !options.preview)

  // need to retrieve imageHeader for "related" in footer and "related articles" for focus since they transitives deps
  resources = await Promise.all(
    resources.map(async r => {
      if (r.type === 'article') {
        r.imageHeader = await populateImageHeader(r)
      }
      return r
    }),
  )

  return generateFocusHTML(article, topics, definitions, resources, options)
}

// Article or Focus file name
exports.articleFileName = resource =>
  dynamicConfVar('htmlFileName.' + resource.type, resource)

// smoosh nested info to provide direct access in React components
const flattenMetas = (exports.flattenMetas = article => {
  return {
    ...article,
    imageHeader: getMetaText(article, 'image-header'),
    title: getMetaText(article, 'title'),
    summaries: {
      en: getMetaText(article, 'summary-en'),
      fr: getMetaText(article, 'summary-fr'),
    },
    keywords: getMetaList(article, 'keywords'),
    footnotes: getNodeList(article, 'footnotes'),
    related: getMetaList(article, 'related'),
  }
})

const populateImageHeader = (exports.populateImageHeader = async article => {
  const imageHeaderId = getMetaText(article, 'image-header')
  return Resources.findById(imageHeaderId)
})

const getNodeList = (article, type) => {
  const found = article.nodes.find(m => m.type === type)
  return (found && found.list) || []
}
const getMeta = (article, type) => article.metas.find(m => m.type === type)
const getMetaList = (article, type) => {
  const found = getMeta(article, type)
  return (found && found.list) || []
}
const getMetaText = (article, type) => {
  const found = getMeta(article, type)
  return found ? found.text : null
}

const getResources = async (article, excludeUnpublished = false) => {
  const ids = [
    getMetaText(article, 'image-header'),
    ...getMetaList(article, 'related').map(
      ({ text }) => text.split(/\s*-\s*/)[0],
    ),
    ...article.nodes
      .filter(node => node.type === 'resource')
      .map(node => node.id),
  ].filter(id => !!id)

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
