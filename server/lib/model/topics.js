'use strict'

const { fullTopic, validate } = require('../schemas')

const {
  search,
  find,
  findById,
  insert,
  update,
  remove,
} = require('../es/client')('topic')

exports.search = search

exports.list = find

exports.findById = findById

exports.create = async doc => {
  const topic = await validate(doc, fullTopic)
  return (await findById(topic.id))
    ? Promise.reject(new Error('Invalid Id (already exists)'))
    : insert(topic, topic.id)
}

exports.update = (id, doc) =>
  validate(doc, fullTopic).then(topic => update(id, topic))

exports.remove = remove
