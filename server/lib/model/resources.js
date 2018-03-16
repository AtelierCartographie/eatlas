'use strict'

const { fullResource, validate } = require('../schemas')

const {
  search,
  find,
  // findOne,
  findById,
  insert,
  update,
  remove,
} = require('../es/client')('resource')

exports.search = search

exports.list = find

exports.findById = findById

exports.create = async resource => {
  const body = await validate(resource, fullResource)
  const found = await exports.findById(body.id)
  if (found) {
    const error = new Error('Duplicate Name')
    error.code = 'EDUPLICATE'
    throw error
  }
  return await insert(body, body.id)
}

exports.update = async (id, updates) => {
  let statusModified = false
  if (updates.status) {
    const resource = await findById(id)
    if (resource.status !== updates.status) {
      statusModified = true
    }
  }

  const updated = await update(id, updates)

  if (statusModified) {
    // TODO publish/unpublish business logic (cf. #43)
  }

  return updated
}

// TODO unpublish (cf. #43) AND hard remove files (cf. #42)
exports.remove = remove
