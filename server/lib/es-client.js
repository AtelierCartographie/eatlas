'use strict'

const { Client } = require('elasticsearch')
const { es: { connection, index } } = require('config')

const client = new Client(connection)

const formatHit = ({ _source, _id }) => Object.assign({}, _source, { id: _id })

module.exports = type => {
  const find = body =>
    client
      .search({ index, type, body })
      .then(res => res.hits.hits.map(formatHit))

  const findOne = body => find(body).then(([result]) => result || null)

  const findById = id =>
    client
      .get({ index, type, id })
      .then(hit => (hit.found ? formatHit(hit) : null))

  const insert = body =>
    client
      .index({ index, type, body })
      .then(({ _id }) => formatHit({ _source: body, _id }))

  const update = (id, doc) =>
    client.update({ index, type, id, body: { doc } }).then(() => findById(id))

  const remove = id => client.delete({ index, type, id })

  return { find, findOne, findById, insert, update, remove }
}

module.exports.index = index
module.exports.client = client
