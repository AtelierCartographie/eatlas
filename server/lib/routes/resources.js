'use strict'

const request = require('request-promise-native')
const config = require('config')

const { resources } = require('../model')
const schemas = require('../schemas')
const { parseDocx } = require('../doc-parser')
const { saveMedia } = require('../public-fs')

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
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundResource)

exports.addFromGoogle = (req, res) => {
  // Export to requested format (or keep original if not forced by config)
  const url = getFileUrl(req.body)
  const options = { encoding: null, auth: { bearer: req.body.accessToken } }

  request(url, options)
    .then(fileHandler(req, res))
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
      if (err.code === 'EDUPLICATE') {
        return res.boom.conflict(err.message)
      }
      res.boom.badImplementation(err)
    })
}
exports.addFromGoogle.schema = schemas.uploadFromGoogleDrive

exports.list = (req, res) =>
  resources
    .list()
    .then(resources => res.send(resources))
    .catch(res.boom.send)

exports.remove = (req, res) =>
  resources
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(res.boom.send)

const getFileUrl = ({ type, fileId }) => {
  const exportFormat = config.google.exportFormat[type]
  const url = exportFormat ? config.google.exportUrl : config.google.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

const fileHandler = (req, res) => {
  const { type } = req.body

  if (type === 'article') {
    return parseDocx
  }

  if (type === 'image') {
    return buffer =>
      saveMedia({
        name: req.body.name,
        type: req.body.type,
        mimeType: req.body.mimeType,
        buffer,
      })
  }

  return () => Promise.reject(res.boom.notImplemented())
}
