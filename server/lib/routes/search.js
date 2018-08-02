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
const match = (field, text, boost = 1) => ({
  match: { [field]: { query: text, operator: 'and', cutoff_frequency: 0.001, boost } },
})
const nested = (path, query) => ({ nested: { path, score_mode: 'max', query } })
const range = (field, query) => ({ range: { [field]: query } })

// WARNING! Destructive method
const push = (filters, filter, boost = null) => filters.push(boost === null
  ? filter
  : { constant_score: { filter, boost } }
)

const search = ({ preview = false } = {}) => async (req, res) => {
  debug('Input', req.body)

  try {
    // AND
    const must = []

    // Exclude unpublished resources
    if (!preview) {
      push(must, term('status', 'published'), config.searchSort.scoreSpecial.status || 0)
    }

    // Exclude Lexicon because we can't handle definitions properly
    push(must, { bool: { must_not: term('id', 'LEXIC') } }, 0)

    // Resource types?
    if (req.body.types) {
      push(must, term('type', req.body.types), config.searchSort.scoreSpecial.type || 0)
      // Specific to lexicon: filter by A-Z
      push(must, { prefix: { 'title.keyword': req.body.letter } })
    }

    // Full-text query (OR on each field)
    // Meaningful score here: handle boost carefully
    if (req.body.q) {
      const should = []
      config.searchFields.forEach(field => {
        if (field.indexOf('.') !== -1) {
          // Nested field
          const path = field.substring(0, field.indexOf('.'))
          should.push(nested(path, match(field, req.body.q, config.searchSort.boostSearchField[path] || 1)))
        } else {
          should.push(match(field, req.body.q, config.searchSort.boostSearchField[field] || 1))
        }
      })
      must.push({ bool: { should } })
    }

    // Locale
    if (req.body.locales) {
      push(must, term('language', req.body.locales), config.searchSort.scoreSpecial.keywords || 0)
    }

    // Topics
    if (req.body.topics) {
      push(must, term('topic', req.body.topics), config.searchSort.scoreSpecial.topic || 0)
    }

    // Keywords
    if (req.body.keywords) {
      push(
        must,
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
        config.searchSort.scoreSpecial.keyword,
      )
    }

    // Published at
    if (req.body['date-min'] || req.body['date-max']) {
      const min = req.body['date-min'] && new Date(req.body['date-min'])
      const max = req.body['date-max'] && new Date(req.body['date-max'])
      if (min || max) {
        let cmp = {}
        if (min) cmp.gte = min
        if (max) cmp.lte = max
        push(must, range('publishedAt', cmp), 0) // filter out => score = 0
      }
    }

    const page = Number(req.body.page) || 1
    const size = Number(req.body.size) || nbPerPage
    const from = (page - 1) * size

    const withBoost = {
      function_score: {
        script_score: {
          script: {
            lang: 'painless',
            params: { typeBoost: config.searchSort.boostType },
            inline: `if (params.typeBoost[doc['type'].value] != null) { return _score * params.typeBoost[doc['type'].value] } else { return _score }`,
          },
        },
        query: { bool: { must } },
      }
    }

    const body = { explain: debug.enabled, query: withBoost, sort: [{ _score: 'desc', [sortField]: sortDir }] }
    if (debug.enabled) {
      debug('Query', inspect({ body, size, from }, false, 99, false))
    }

    const result = await Resources.search({ body, size, from })
    if (debug.enabled) {
      debug('Result', inspect(result, false, 10, false))
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
