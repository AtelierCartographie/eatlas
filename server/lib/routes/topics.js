'use strict'

const { topics, resources } = require('../model')
const { generateTopicHTML, generate404HTML } = require('../html-generator')

exports.list = (req, res) =>
  topics
    .list()
    .then(topics => topics.sort((t1, t2) => t1.id - t2.id))
    .then(topics => res.send(topics))
    .catch(res.boom.send)

exports.findTopic = (allowNotFound = false) => (req, res, next) =>
  topics
    .findById(req.params.id)
    .then(topic => {
      if (!topic && !allowNotFound) {
        return res.boom.notFound('Unknown Topic Id')
      }
      req.foundTopic = topic
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundTopic)

exports.update = async (req, res) => {
  // a valid resourceId can only been provided on update
  // since topics must be created before related resources are imported
  if (req.body.resourceId) {
    const resource = await resources.findById(req.body.resourceId)
    if (!resource) return res.boom.notFound('Unknown Resource Id')

    if (!['image', 'video'].includes(resource.type))
      return res.boom.badRequest('Wrong resource type should be image or video')

    if (req.foundTopic.id !== resource.topic)
      return res.boom.badRequest(
        `Resource topic mismatch: ${req.foundTopic.id} vs ${resource.topic}`,
      )
  }
  topics
    .update(req.foundTopic.id, req.body)
    .then(updatedTopic => res.send(updatedTopic))
    .catch(res.boom.send)
}

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
    if (!req.foundTopic) {
      return res.send(await generate404HTML({ preview: true }))
    }
    const html = await generateTopicHTML(req.foundTopic, { preview: true })
    res.send(html)
  } catch (err) {
    next(err)
  }
}
