'use strict'

const config = require('config')
const { resources: Resources, topics: Topics } = require('../model')
const logger = require('../logger')
const debug = require('debug')('eatlas:search')
const { inspect } = require('util')
const { populatePageUrl, populateThumbnailUrl } = require('../generator-utils')
const { TYPES, CLIENT_TYPES } = require('../../../client/src/universal-utils')

const sortField = 'publishedAt'
const sortDir = 'desc'
const nbPerPage = 10

const term = (field, values) => ({
  [Array.isArray(values) ? 'terms' : 'term']: { [field]: values },
})
const match = (field, text) => ({
  match: { [field]: { query: text, operator: 'and', cutoff_frequency: 0.001 } },
})
const nested = (path, query) => ({ nested: { path, score_mode: 'max', query } })
const range = (field, query) => ({ range: { [field]: query } })

const search = ({ preview = false } = {}) => async (req, res) => {
  debug('Input', req.body)

  try {
    // AND
    const must = []

    // Exclude unpublished resources
    if (!preview) {
      must.push(term('status', 'published'))
    }

    // Exclude Lexicon because we can't handle definitions properly
    must.push({ bool: { must_not: term('id', 'LEXIC') } })

    // Resource types?
    if (req.body.types) {
      must.push(term('type', req.body.types))
    }

    // Full-text query (OR on each field)
    if (req.body.q) {
      const should = []
      config.searchFields.forEach(field => {
        if (field.indexOf('.') !== -1) {
          // Nested field
          const path = field.substring(0, field.indexOf('.'))
          should.push(nested(path, match(field, req.body.q)))
        } else {
          should.push(match(field, req.body.q))
        }
      })
      must.push({ bool: { should } })
    }

    // Locale
    if (req.body.locales) {
      must.push(term('language', req.body.locales))
    }

    // Topics
    if (req.body.topics) {
      must.push(term('topic', req.body.topics))
    }

    // Keywords
    if (req.body.keywords) {
      must.push(
        nested('metas', {
          bool: {
            must: [
              term('metas.type', 'keywords'),
              nested(
                'metas.list',
                term('metas.list.text.keyword', req.body.keywords),
              ),
            ],
          },
        }),
      )
    }

    // Published at
    if (req.body['date-min'] || req.body['date-max']) {
      const min = new Date(req.body['date-min'])
      const max = new Date(req.body['date-max'])
      if (min || max) {
        let cmp = {}
        if (min) cmp.gte = min
        if (max) cmp.lte = max
        must.push(range('publishedAt', cmp))
      }
    }

    const page = Number(req.body.page) || 1
    const size = Number(req.body.size) || nbPerPage
    const from = (page - 1) * size

    const body = { query: { bool: { must } }, sort: [{ [sortField]: sortDir }] }
    if (debug.enabled) {
      debug('Query', inspect({ body, size, from }, false, 99, false))
    }

    const result = await Resources.search({ body, size, from })
    if (debug.enabled) {
      debug('Result', inspect(result, false, 3, false))
    }

    const topics = await Topics.list()
    const resultResources = result.hits.hits.map(({ _source }) => _source)

    // To compute thumbnails, I need resources: related articles, header images
    const thumbnailResources = await getResourcesForThumbnails(
      resultResources,
      { preview },
    )

    res.send({
      start: from + 1,
      end: from + result.hits.hits.length,
      count: result.hits.total,
      hits: resultResources
        .map(populatePageUrl(null, topics, { preview }))
        .map(populateThumbnailUrl(thumbnailResources, { preview }))
        .map(formatResultHit),
    })
  } catch (err) {
    logger.error('Search failed', { input: req.body, err })
    res.boom.badImplementation(err)
  }
}

// To make it not too hard and not too inefficient:
// - include all (published) articles if there is a focus in results
// - include all (published) images if there is a focus or an article in results
const getResourcesForThumbnails = async (resources, { preview }) => {
  const hasArticle = resources.some(({ type }) => type === 'article')
  const hasFocus = resources.some(({ type }) => type === 'focus')
  const includeArticles = hasFocus
  const includeImages = hasFocus || hasArticle
  if (!includeArticles && !includeImages) {
    return []
  }
  let types = []
  if (includeArticles) {
    types.push('article')
  }
  if (includeImages) {
    types.push('image')
  }
  const query = { terms: { type: types } }
  return Resources.list(
    preview
      ? { query }
      : {
          query: { bool: { must: [{ term: { status: 'published' } }, query] } },
        },
  )
}

const formatResultHit = resource => ({
  title: resource.title,
  subtitle: resource.subtitle,
  type: resource.type,
  typeLabel: CLIENT_TYPES[resource.type] || TYPES[resource.type],
  url: resource.type === 'reference' ? resource.description_fr : resource.pageUrl,
  preview: resource.thumbnailUrl
    ? {
        url: resource.thumbnailUrl,
      }
    : null,
  extra:
    resource.type === 'single-definition'
      ? {
          definition: resource.description_fr,
          aliases: resource.metas
            .filter(m => m.type === 'alias')
            .map(m => m.text),
        }
      : null,
})

exports.search = search()
exports.preview = search({ preview: true })
