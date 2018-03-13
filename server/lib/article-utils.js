'use strict'

// TODO focus HTML too

const { generateArticleHTML } = require('./html-generator')
const { resources: Resources, topics: Topics } = require('./model')
const dynamicConfVar = require('./dynamic-config-variable')

exports.generateArticleHTML = async (resource, options) => {
  const article = flattenMetas(resource)
  const topics = (await Topics.list()).sort((a, b) => a.id > b.id)
  const definitions = await getDefinitions()
  const resources = await getResources(resource, !options.preview)
  return generateArticleHTML(article, topics, definitions, resources, options)
}

exports.articleFileName = resource =>
  dynamicConfVar('htmlFileName.' + resource.type, resource)

// smoosh nested info to provide direct access in React components
const flattenMetas = exports.flattenMetas = article => {
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
  }
}

const getNode = (article, type) => article.nodes.find(m => m.type === type)
const getNodeList = (article, type) => {
  const found = getNode(article, type)
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
  const ids = []
    .concat(
      getMetaList(article, 'related').map(
        ({ text }) => text.split(/\s*-\s*/)[0],
      ),
    )
    .concat([getMetaText(article, 'image-header')])
    .concat(
      article.nodes
        .filter(node => node.type === 'resource')
        .map(node => node.id),
    )
    .filter(id => !!id)

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

