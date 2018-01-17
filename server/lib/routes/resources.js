'use strict'

const request = require('request-promise-native')
const config = require('config')
const Boom = require('boom')

const { resources } = require('../model')
const schemas = require('../schemas')
const { parseDocx } = require('../doc-parser')
const { saveMedia } = require('../public-fs')

exports.findResource = (req, res, next) =>
  resources
    .findById(req.params.id)
    .then(resource => {
      if (!resource) {
        return Boom.notFound('Unknown Resource Id')
      }
      req.foundResource = resource
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundResource)

exports.addFromGoogle = async (req, res) => {
  try {
    // Handle uploaded files
    try {
      validateUploads(req, res)
    } catch (e) {
      throw Boom.badRequest('Upload error: ' + e.message)
    }
    const urls = req.body.uploads.map(up =>
      getFileUrl(req.body.type, up.fileId),
    )
    const options = { encoding: null, auth: { bearer: req.body.accessToken } }
    const buffers = await Promise.all(urls.map(url => request(url, options)))

    // Inject buffer into each upload object
    req.body.uploads.forEach((upload, index) => {
      upload.buffer = buffers[index]
    })

    const data = await handleUploads(req, res)

    const resource = await resources.create(
      Object.assign({}, data, {
        id: req.body.id,
        type: req.body.type,
      }),
    )

    res.send({ id: resource.id })
  } catch (err) {
    if (err.isJoi) {
      res.boom.badRequest(err.message, {
        details: err.details,
        object: err._object,
        annotated: err.annotate(),
      })
    } else if (err.code === 'EDUPLICATE') {
      res.boom.conflict(err.message)
    } else {
      // Force output message to be kept
      res.boom.send(err, { message: err.message })
    }
  }
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

const getFileUrl = (type, fileId) => {
  const exportFormat = config.google.exportFormat[type]
  const url = exportFormat ? config.google.exportUrl : config.google.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

const RE_IMAGE_UPLOAD_KEY = /^image-(small|medium|large)-(1x|2x|3x)$/

// TODO check mime-type too
// TODO structure validation may go in a Joi schema with when 'n co, but it may make it too complex (it's enough already)
const validateUploads = req => {
  const { uploads, type } = req.body
  switch (type) {
    case 'article':
      if (uploads.length !== 1 || uploads[0].key !== 'article') {
        throw new Error('expecting a single "article" document')
      }
      break
    case 'map':
      if (uploads.length !== 1 || uploads[0].key !== 'map') {
        throw new Error('expecting a single "map" document')
      }
      break
    case 'image':
      uploads.forEach(u => {
        if (!u.key.match(RE_IMAGE_UPLOAD_KEY)) {
          throw new Error('invalid upload key "' + u.key + '"')
        }
      })
      // Mandatory sizes
      if (!uploads.some(u => u.key === 'image-medium-1x')) {
        throw new Error('required document "image-medium-1x"')
      }
      break
    default:
      throw Boom.notImplemented()
  }
}

// Returns additional metadata to be merged into resource before creation
const handleUploads = async req => {
  const { uploads, type } = req.body
  switch (type) {
    case 'article': {
      return parseDocx(uploads[0].buffer)
    }
    case 'map': {
      const file = await saveMedia({
        id: req.body.id,
        type: req.body.type,
        upload: uploads[0],
      })
      return { file }
    }
    case 'image': {
      const files = await Promise.all(
        uploads.map(upload =>
          saveMedia({
            id: req.body.id,
            type: req.body.type,
            upload,
          }),
        ),
      )
      const images = { small: {}, medium: {}, large: {} }
      uploads.forEach(({ key }, index) => {
        const [, size, density] = key.match(RE_IMAGE_UPLOAD_KEY)
        images[size][density] = files[index]
      })
      return { images }
    }
    default:
      throw Boom.notImplemented()
  }
}
