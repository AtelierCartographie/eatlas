'use strict'

const request = require('request-promise-native')
const config = require('config')

const { resources } = require('../model')
const schemas = require('../schemas')
const { parseDocx } = require('../doc-parser')

exports.findResource = (req, res, next) =>
  resources
    .findById(req.params.id)
    .then(resource => {
      if (!resource) {
        return res.boom.notFound('Unknown Resource Id')
      }
      req.foundResource = resource
      next()
    })
    .catch(err => res.boom.badImplementation(err))

exports.get = (req, res) => res.send(req.foundResource)

exports.addFromGoogle = (req, res) => {
  const url = config.google.exportUrl
    .replace(/FILE_ID/g, encodeURIComponent(req.body.fileId))
    .replace(/FORMAT/g, encodeURIComponent(config.google.exportFormat))
  const options = { encoding: null, auth: { bearer: req.body.accessToken } }

  request(url, options)
    .then(parseDocx)
    .then(data =>
      Object.assign({}, data, {
        name: req.body.name,
        type: req.body.type,
      }),
    )
    .then(resources.create)
    // Respond only with resource's id
    .then(resource => res.send({ id: resource.id }))
    .catch(err => {
      if (err.isJoi) {
        return res.boom.badRequest(err.message, {
          details: err.details,
          object: err._object,
          annotated: err.annotate(),
        })
      }
      res.boom.badImplementation(err)
    })
}
exports.addFromGoogle.schema = schemas.uploadFromGoogleDrive

exports.list = (req, res) =>
  resources
    .list()
    .then(resources => res.send(resources))
    .catch(err => res.boom.badImplementation(err))

exports.remove = (req, res) =>
  resources
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.boom.badImplementation(err))
