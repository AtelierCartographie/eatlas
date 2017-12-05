'use strict'

const { Client } = require('elasticsearch')
const { es: { connection, index } } = require('config')

const client = new Client(connection)

const formatHit = ({ _source, _id }) => Object.assign({}, _source, { id: _id })

exports.listUsers = () =>
  client
    .search({
      index,
      type: 'user',
    })
    .then(res => res.hits.hits.map(formatHit))

exports.findUserByEmail = email =>
  client
    .search({
      index,
      type: 'user',
      body: { query: { term: { email } } },
    })
    .then(res => (res.hits.total === 0 ? null : formatHit(res.hits.hits[0])))

exports.findUserById = id =>
  client
    .get({
      index,
      type: 'user',
      id,
    })
    .then(hit => (hit.found ? formatHit(hit) : null))

exports.addUser = body =>
  client
    .index({
      index,
      type: 'user',
      body,
    })
    .then(({ _id }) => formatHit({ _source: body, _id }))

exports.updateUser = (id, updates) =>
  client
    .update({
      index,
      type: 'user',
      id,
      body: {
        doc: updates,
      },
    })
    .then(() => exports.findUserById(id))
