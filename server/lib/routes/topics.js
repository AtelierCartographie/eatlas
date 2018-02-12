'use strict'

const { topics } = require('../model')

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
