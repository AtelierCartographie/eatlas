'use strict'

const request = require('request-promise-native')
const config = require('config')

const { resources } = require('../model')
const schemas = require('../schemas')

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
    .then(body => {
      console.log(body)
      // TODO convert body to resource
      const resource = {
        nodes: [],
      }
      return resources.create(resource)
    })
    // Respond only with resource's id
    .then(res => res.send({ id: res.id }))
    .catch(err => {
      console.error(err)
      res.boom.badImplementation(err)
    })
}
exports.addFromGoogle.schema = schemas.uploadFromGoogleDrive
