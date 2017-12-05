'use strict'

const { Client } = require('elasticsearch')
const { es: { connection, indices } } = require('config')
const initIndices = require('./init-es-index')

const client = new Client(connection)

const formatHit = ({ _source, _id }) => Object.assign({}, _source, { id: _id })

initIndices(client, indices)

module.exports = type => {
  const find = body =>
    client
      .search({ index: indices[type], type, body })
      .then(res => res.hits.hits.map(formatHit))

  const findOne = body => find(body).then(([result]) => result || null)

  const findById = id =>
    client
      .get({ index: indices[type], type, id })
      .then(hit => (hit.found ? formatHit(hit) : null))

  const insert = body =>
    client
      .index({ index: indices[type], type, body })
      .then(({ _id }) => formatHit({ _source: body, _id }))

  const update = (id, doc) =>
    client
      .update({ index: indices[type], type, id, body: { doc } })
      .then(() => findById(id))

  const remove = id => client.delete({ index: indices[type], type, id })

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
