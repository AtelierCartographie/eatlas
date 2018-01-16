'use strict'

const { fullResource, validate } = require('../schemas')

const {
  find,
  findOne,
  findById,
  insert,
  update,
  remove,
} = require('../es-client')('resource')

exports.list = () => find()

exports.findById = findById

exports.findByName = name => findOne({ query: { term: { name } } })

exports.create = async resource => {
  const found = await exports.findByName(resource.name)
  if (found) {
    const error = new Error('Duplicate Name')
    error.code = 'EDUPLICATE'
    throw error
  }
  const body = await validate(resource, fullResource)
  const result = await insert(body) // TODO use body.name as ES id?
  return result
}

exports.update = update

exports.remove = remove
