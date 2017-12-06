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

exports.create = resource => validate(resource, fullResource).then(insert)

exports.update = update

exports.remove = remove
