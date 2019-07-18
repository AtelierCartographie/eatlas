'use strict'

const { Client } = require('elasticsearch')
const {
  es: { connection, indices, maxConcurrentWrites },
} = require('config')
const AgentKeepAlive = require('agentkeepalive')
const { promisify } = require('util')
const initIndices = require('./init-index')
const EsLogger = require('./logger')
const logger = require('../logger')
const writeQueue = require('./queue')({ max: maxConcurrentWrites })

// https://github.com/elastic/elasticsearch-js/issues/117
// needs to be true to have IMMEDIATE and CORRECT results in a search succeeding a delete for example
const refresh = true

const client = new Client(
  Object.assign(
    {
      keepAlive: true,
      createNodeAgent: (conn, conf) =>
        new AgentKeepAlive(conn.makeAgentConfig(conf)),
      log: EsLogger,
    },
    connection,
  ),
)

const pinged = (() => {
  const sleep = promisify(setTimeout)
  let readyP = null
  const check = () => {
    if (readyP) {
      return readyP
    }
    return (
      client
        .ping() // TODO find a more silent way, this logs a awful bunch of messages
        // Connection ready: we can start querying
        .then(() => {
          readyP = Promise.resolve()
        })
        // Not ready: try again later
        .catch(() => {
          logger.error('Connection to ES server failed, trying again…') // eslint-disable-line no-console
          return sleep(2000).then(check) // TODO configurable timeout
        })
    )
  }
  return check()
})()

const formatHit = ({ _source, _id }) => Object.assign({}, _source, { id: _id })

const ready = pinged.then(() => initIndices(client, indices))

module.exports = type => {
  const search = options =>
    client.search({ index: indices[type], type, ...options })

  const find = (body, { size = 1000, from = 0 } = {}) =>
    search({ body, size, from }).then(res => res.hits.hits.map(formatHit))

  const findOne = body =>
    find(body, { size: 1 }).then(([result]) => result || null)

  const findById = async (id, requiresPublished = false) =>
    id
      ? client
          .get({ index: indices[type], type, id })
          .then(hit =>
            hit.found &&
            (!requiresPublished || hit._source.status === 'published')
              ? formatHit(hit)
              : null,
          )
          .catch(err => (err.status === 404 ? null : Promise.reject(err)))
      : null

  const insert = (body, id = null) =>
    writeQueue(() =>
      client
        .index({ index: indices[type], type, body, refresh, id })
        .then(({ _id }) => formatHit({ _source: body, _id })),
    )

  const update = (id, doc, advanced = false) =>
    writeQueue(() => {
      // Advanced update: full body provided (e.g. { script })
      const body = advanced ? doc : { doc }
      return client
        .update({ index: indices[type], type, id, body, refresh })
        .then(() => findById(id))
    })

  const remove = id =>
    writeQueue(() => client.delete({ index: indices[type], type, id, refresh }))

  const deleteByQuery = body =>
    writeQueue(() =>
      client.deleteByQuery({
        index: indices[type],
        type,
        body,
        refresh,
        conflicts: 'proceed',
      }),
    )

  return {
    search,
    find,
    findOne,
    findById,
    insert,
    update,
    remove,
    deleteByQuery,
    index: indices[type],
    type,
  }
}

module.exports.client = client
module.exports.ready = ready
