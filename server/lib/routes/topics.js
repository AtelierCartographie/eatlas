'use strict'

const { topics, resources } = require('../model')
const { generateTopicHTML } = require('../html-generator')

exports.list = (req, res) =>
  topics
    .list()
    .then(topics => res.send(topics))
    .catch(res.boom.send)

exports.findTopic = (req, res, next) =>
  topics
    .findById(req.params.id)
    .then(topic => {
      if (!topic) {
        return res.boom.notFound('Unknown Topic Id')
      }
      req.foundTopic = topic
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundTopic)

exports.update = (req, res) =>
  topics
    .update(req.foundTopic.id, req.body)
    .then(updatedTopic => res.send(updatedTopic))
    .catch(res.boom.send)

exports.add = (req, res) =>
  topics
    .create(req.body)
    .then(topic => res.send(topic))
    .catch(res.boom.send)

exports.remove = (req, res) =>
  topics
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(res.boom.send)

exports.preview = async (req, res, next) => {
  try {
    const html = generateTopicHTML(
      req.foundTopic,
      (await topics.list()).sort((a, b) => a.id > b.id),
      await getArticles(req.foundTopic, !!req.query.published),
      { preview: true }
    )
    res.send(html)
  } catch (err) {
    next(err)
  }
}

const getArticles = async (topic, excludeUnpublished = false) => {
  // TODO handle query ES side
  return (await resources.list()).filter(
    r => r.type === 'article' && r.topic == topic.id,
  )
}
