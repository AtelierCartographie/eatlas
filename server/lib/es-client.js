'use strict'

const { Client } = require('elasticsearch')
const { es: { connection, indices } } = require('config')
const AgentKeepAlive = require('agentkeepalive')
const { promisify } = require('util')
const initIndices = require('./init-es-index')
const EsLogger = require('./es-logger')
const logger = require('./logger')

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

const ready = (() => {
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

ready.then(() => initIndices(client, indices))

module.exports = type => {
  const find = body =>
    client
      .search({ index: indices[type], type, body, size: 1000 }) // FIXME pagination
      .then(res => res.hits.hits.map(formatHit))

  const findOne = body => find(body).then(([result]) => result || null)

  const findById = id =>
    client
      .get({ index: indices[type], type, id })
      .then(hit => (hit.found ? formatHit(hit) : null))

  const insert = (body, id = null) =>
    client
      .index({ index: indices[type], type, body, refresh, id })
      .then(({ _id }) => formatHit({ _source: body, _id }))

  const update = (id, doc) =>
    client
      .update({ index: indices[type], type, id, body: { doc }, refresh })
      .then(() => findById(id))

  const remove = id =>
    client.delete({ index: indices[type], type, id, refresh })

  return {
    find,
    findOne,
    findById,
    insert,
    update,
    remove,
    index: indices[type],
    type,
  }
}

module.exports.client = client
module.exports.ready = ready
