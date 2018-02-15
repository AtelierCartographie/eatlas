'use strict'

const Boom = require('boom')
const merge = require('lodash.merge')

const { resources, topics } = require('../model')
const schemas = require('../schemas')
const { parseDocx } = require('../doc-parser')
const { parseLexicon } = require('../lexicon-parser')
const { saveMedia } = require('../public-fs')
const { generateHTML } = require('../html-generator')
const { download } = require('../google')

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

exports.update = async (req, res) => {
  const baseData = Object.assign({}, req.body)

  resources
    .update(req.foundResource.id, baseData)
    .then(resource => res.send(resource))
    .catch(res.boom.send)
}

// TODO add Joi schema
exports.updateFromGoogle = async (req, res) => {
  const baseData = Object.assign({}, req.body)
  // Every field is a resource's field to be updated, except 'uploads' & 'accessToken'
  delete baseData.uploads
  delete baseData.accessToken

  const body = Object.assign(
    { id: req.foundResource.id, type: req.foundResource.type, uploads: [] },
    req.body,
  )
  handleUploads(body, false)
    .then(data => merge(baseData, data))
    .then(updates => resources.update(req.foundResource.id, updates))
    .then(resource => res.send(resource))
    .catch(res.boom.send)
}

const getBaseData = req => ({
  author: req.session.user.email,
  status:
    req.body.type === 'definition'
      ? 'published' // Lexicon is always published
      : 'submitted',
  createdAt: Date.now(),
  id: req.body.id,
  type: req.body.type,
  title: req.body.title,
  subtitle: req.body.subtitle,
  topic: req.body.topic,
  language: req.body.language,
  description: req.body.description,
  copyright: req.body.copyright,
  mediaUrl: req.body.mediaUrl,
})

exports.add = (req, res) => {
  const baseData = getBaseData(req)

  resources
    .create(baseData)
    .then(resource => res.send(resource))
    .catch(
      err =>
        err.code === 'EDUPLICATE'
          ? res.boom.conflict(err.message)
          : res.boom.send(err),
    )
}

exports.add.schema = schemas.resource

exports.addFromGoogle = (req, res) => {
  const baseData = getBaseData(req)

  handleUploads(req.body, true)
    .then(data => merge(baseData, data))
    .then(resources.create)
    .then(resource => res.send(resource))
    .catch(
      err =>
        err.code === 'EDUPLICATE'
          ? res.boom.conflict(err.message)
          : res.boom.send(err),
    )
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

exports.preview = async (req, res, next) => {
  try {
    req.foundResource.resources = await resources.list()
    const html = generateHTML(
      req.foundResource,
      (await topics.list()).sort((a, b) => a.id > b.id),
      await getDefinitions(),
    )
    res.send(html)
  } catch (err) {
    next(err)
  }
}

const getDefinitions = async () => {
  const lexicons = await resources.list({
    query: { term: { type: 'definition' } },
  })
  return lexicons.reduce(
    (definitions, lexicon) => definitions.concat(lexicon.definitions),
    [],
  )
}

const RE_IMAGE_UPLOAD_KEY = /^image-(small|medium|large)-(1x|2x|3x)$/

const expectUploadKeys = (uploads, test) => {
  uploads.forEach(u => {
    if (!test(u.key)) {
      throw new Error('invalid upload key "' + u.key + '"')
    }
  })
}

// Returns additional metadata to be merged into resource before creation
const handleUploads = async (body, required) => {
  const { uploads, type, accessToken } = body
  const newUploads = uploads.filter(u => !!u.fileId)

  // Validate input
  // TODO check mime-type too
  // TODO structure validation may go in a Joi schema with when 'n co, but it may make it too complex (it's enough already)
  switch (type) {
    case 'article': {
      expectUploadKeys(uploads, k => k === 'article')
      if (required && newUploads.length !== 1) {
        throw Boom.badRequest('Upload: expecting a single "article" document')
      }
      break
    }
    case 'map': {
      expectUploadKeys(uploads, k => k === 'map')
      if (required && newUploads.length !== 1) {
        throw Boom.badRequest('Upload: expecting a single "map" document')
      }
      break
    }
    case 'image': {
      expectUploadKeys(uploads, k => k.match(RE_IMAGE_UPLOAD_KEY))
      // Mandatory sizes
      if (required && !newUploads.some(u => u.key === 'image-medium-1x')) {
        throw Boom.badRequest('Upload: required document "image-medium-1x"')
      }
      break
    }
    case 'sound': {
      expectUploadKeys(uploads, k => k === 'sound')
      if (required && newUploads.length !== 1) {
        throw Boom.badRequest('Upload: expecting a single "sound" document')
      }
      break
    }
    case 'definition': {
      expectUploadKeys(uploads, k => k === 'lexicon')
      if (required && newUploads.length !== 1) {
        throw Boom.badRequest('Upload: expecting a single "lexicon" document')
      }
      break
    }
    default:
      throw Boom.notImplemented()
  }

  // Fetch contents
  const buffers = await Promise.all(
    newUploads.map(up => download(up.fileId, type, up.mimeType, accessToken)),
  )

  // Inject buffer into each upload object (mutates 'uploads' too by reference, which is what we want to achieve)
  newUploads.forEach((upload, index) => {
    upload.buffer = buffers[index]
  })

  switch (type) {
    case 'article': {
      const upload = newUploads.find(u => u.key === 'article')
      if (!upload) {
        return null
      }
      // Deletion
      if (!upload.buffer) {
        return { file: null }
      }
      return parseDocx(upload.buffer)
    }
    case 'map': {
      const upload = newUploads.find(u => u.key === 'map')
      if (!upload) {
        return null
      }
      // Deletion
      if (!upload.buffer) {
        return { file: null }
      }
      const file = await saveMedia(body)(upload)
      return { file }
    }
    case 'image': {
      // Save new uploads
      const files = await Promise.all(newUploads.map(saveMedia(body)))
      const images = {}
      // Handle *all* uploads (deletions included)
      uploads.forEach(({ key }, index) => {
        const [, size, density] = key.match(RE_IMAGE_UPLOAD_KEY)
        if (!images[size]) {
          images[size] = {}
        }
        images[size][density] = files[index] || null
      })
      return { images }
    }
    case 'sound': {
      const upload = newUploads.find(u => u.key === 'sound')
      if (!upload) {
        return null
      }
      // Deletion
      if (!upload.buffer) {
        return { file: null }
      }
      const file = await saveMedia(body)(upload)
      return { file }
    }
    case 'definition': {
      const upload = newUploads.find(u => u.key === 'lexicon')
      if (!upload) {
        return null
      }
      // Deletion
      if (!upload.buffer) {
        return { file: null }
      }
      return parseLexicon(upload.buffer)
    }
    default:
      throw Boom.notImplemented()
  }
}
