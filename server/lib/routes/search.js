'use strict'

const config = require('config')
const { resources: Resources } = require('../model')
const logger = require('../logger')
const debug = require('debug')('eatlas:search')
const { inspect } = require('util')

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

const search = ({ excludeUnpublished = true } = {}) => async (req, res) => {
  debug('Input', req.body)

  try {
    // AND
    const must = []

    // Exclude unpublished resources
    if (excludeUnpublished) {
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
    // FIXME this query empties the whole set :(
    if (req.body.keywords) {
      must.push(
        nested('metas', {
          bool: {
            must: [
              term('metas.type', 'keywords'),
              term('metas.list.text', req.body.keywords),
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
      debug('Query', inspect(body, false, 99, false))
    }

    const result = await Resources.search({ body, size, from })
    debug('Result', result)

    res.send({
      start: from + 1,
      end: from + result.hits.hits.length,
      count: result.hits.total,
      hits: result.hits.hits.map(formatResultHit),
    })
  } catch (err) {
    logger.error('Search failed', { input: req.body, err })
    res.boom.badImplementation(err)
  }
}

const formatResultHit = ({ _source: resource }) => ({
  title: resource.title,
  subtitle: resource.subtitle,
  type: resource.type,
  url: '#TODO',
  preview: null,
})

exports.search = search({ excludeUnpublished: true })
exports.preview = search({ excludeUnpublished: false })
