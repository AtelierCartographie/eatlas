'use strict'

const { fullResource, validate } = require('../schemas')

const {
  find,
  // findOne,
  findById,
  insert,
  update,
  remove,
} = require('../es-client')('resource')

exports.list = () => find()

exports.findById = findById

exports.create = async resource => {
  const body = await validate(resource, fullResource)
  const found = await exports.findById(body.id)
  if (found) {
    const error = new Error('Duplicate Name')
    error.code = 'EDUPLICATE'
    throw error
  }
  const result = await insert(body, body.id)
  return result
}

exports.update = update

exports.remove = remove
