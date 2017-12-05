'use strict'

const {
  find,
  findOne,
  findById,
  insert,
  update,
  remove,
} = require('../es-client')('user')

exports.findByEmail = email => findOne({ query: { term: { email } } })
exports.list = () => find()
exports.findById = findById
exports.create = insert
exports.update = update
exports.remove = remove
