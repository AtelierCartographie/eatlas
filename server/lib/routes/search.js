'use strict'

const config = require('config')
const { resources: Resources } = require('../model')
const logger = require('../logger')
const debug = require('debug')('eatlas:search')
const { inspect } = require('util')

const sortVal = r => new Date(r.publishedAt)
const sortDir = 'desc'
const nbPerPage = 1

const term = (field, values) => ({
  [Array.isArray(values) ? 'terms' : 'term']: { [field]: values },
})
const match = (field, text) => ({
  match: { [field]: { query: text, operator: 'and', cutoff_frequency: 0.001 } },
})
const nested = (path, query) => ({ nested: { path, score_mode: 'max', query } })
const range = (field, query) => ({ range: { [field]: query } })

exports.search = async (req, res) => {
  debug('Input', req.body)

  try {
    // Base search: status (AND next criteria)
    const must = [
      term('status', 'published'),
      { bool: { must_not: term('id', 'LEXIC') } },
    ]

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
        must.push(range('createdAt', cmp))
      }
    }

    const page = Number(req.body.page) || 1
    const size = Number(req.body.size) || nbPerPage
    const from = (page - 1) * size

    if (debug.enabled) {
      debug('Query', inspect({ query: { bool: { must } } }, false, 99, false))
    }

    const resources = await Resources.list(
      { query: { bool: { must } } },
      { size, from },
    )
    resources.sort(
      (r1, r2) =>
        sortDir === 'desc'
          ? sortVal(r2) - sortVal(r1)
          : sortVal(r1) - sortVal(r2),
    )

    debug('Results', resources.length)

    res.send(resources)
  } catch (err) {
    logger.error('Search failed', { input: req.body, err })
    res.boom.badImplementation(err)
  }
}
