'use strict'

const merge = require('lodash.merge')
const get = require('lodash.get')

const { resources } = require('../model')
const schemas = require('../schemas')
const {
  generateArticleHTML,
  generateFocusHTML,
  generateResourceHTML,
} = require('../html-generator')
const { download } = require('../google')
const { updateFiles, deleteAllFiles } = require('../public-fs')
const uploadManagers = require('../upload-managers')
const { resourceMediaPath } = require('../resource-path')

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
  const baseData = Object.assign(
    { updatedBy: req.session.user.email },
    req.body,
  )
  // Every field is a resource's field to be updated, except 'uploads' & 'accessToken'
  delete baseData.uploads
  delete baseData.accessToken

  const body = Object.assign({}, req.foundResource, { uploads: [] }, req.body)
  // TODO handle upload deletion
  handleUploads(body, false)
    .then(data => merge(baseData, data))
    .then(updates => resources.update(req.foundResource.id, updates))
    .then(async resource => {
      const oldStatus = req.foundResource.status
      const newStatus = resource.status
      const changedPublished =
        oldStatus !== newStatus &&
        (oldStatus === 'published' || newStatus === 'published')
      if (changedPublished) {
        try {
          await updateFiles(resource)
        } catch (err) {
          await resources.update(req.foundResource.id, { status: oldStatus })
          err.message =
            'Failed to update files on (un)publishing: ' + err.message
          throw err
        }
      }
      return resource
    })
    .then(resource => res.send(resource))
    .catch(res.boom.send)
}

const getBaseData = req => ({
  updatedBy: req.session.user.email,
  author: req.body.author,
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
    .then(updateFiles)
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
    .then(updateFiles)
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
    .then(() => deleteAllFiles(req.foundResource))
    .then(() => res.status(204).end())
    .catch(res.boom.send)

exports.file = async (req, res, next) => {
  try {
    switch (req.foundResource.type) {
      // Binary previews: audio, map and image
      // Note: map and image have multiple files, that can be selected with req.params.k
      case 'map':
      case 'image': {
        const { images } = req.foundResource
        let file = null
        if (req.params.k) {
          // req.params.k can be directly a path into 'images' property, like "small.2x"
          // or a "doc key", like "image-small-2x"
          // we convert the second into the first:
          const keyMatch = req.params.k.match(
            /^(map|image)-(small|medium|large)-([123]x)/,
          )
          const keyPath = keyMatch
            ? keyMatch[2] + '.' + keyMatch[3]
            : req.params.k
          file = get(images, keyPath)
        }
        if (!file) {
          // use first found image (smaller to larger)
          file =
            (images['small'] &&
              (images['small']['1x'] ||
                images['small']['2x'] ||
                images['small']['3x'])) ||
            (images['medium'] &&
              (images['medium']['1x'] ||
                images['medium']['2x'] ||
                images['medium']['3x'])) ||
            (images['large'] &&
              (images['large']['1x'] ||
                images['large']['2x'] ||
                images['large']['3x']))
        }
        const { up } = resourceMediaPath(req.foundResource, file, {
          pub: false,
        })
        return res.sendFile(up)
      }
      case 'sound': {
        const { up } = resourceMediaPath(req.foundResource, null, {
          pub: false,
        })
        return res.sendFile(up)
      }
      // No direct download for other types
      default:
        return res.boom.badRequest('No file download for this type')
    }
  } catch (err) {
    next(err)
  }
}

exports.preview = async (req, res, next) => {
  const resource = req.foundResource
  const options = { preview: true }
  try {
    switch (resource.type) {
      // HTML previews: article & focus
      case 'article':
        return res.send(await generateArticleHTML(resource, options))
      case 'focus': {
        return res.send(await generateFocusHTML(resource, options))
      }
      // Binary previews: audio, map and image
      // Note: map and image have multiple files, that can be selected with req.params.k
      case 'map':
      case 'image':
      case 'sound':
      case 'video':
        return res.send(await generateResourceHTML(resource, options))
      default:
        return res.boom.badRequest('No preview for this type')
    }
  } catch (err) {
    next(err)
  }
}

// Returns additional metadata to be merged into resource before creation
const handleUploads = async (body, required) => {
  const { uploads, type, accessToken } = body
  const newUploads = uploads.filter(u => !!u.fileId)

  const { validate, save } = uploadManagers[type]

  // Validate input
  // TODO check mime-type too
  // TODO structure validation may go in a Joi schema with when 'n co, but it may make it too complex (it's enough already)
  validate({ newUploads, required, type, uploads })

  // Fetch contents
  const buffers = await Promise.all(
    newUploads.map(up => download(up.fileId, type, up.mimeType, accessToken)),
  )

  // Inject buffer into each upload object (mutates 'uploads' too by reference, which is what we want to achieve)
  newUploads.forEach((upload, index) => {
    upload.buffer = buffers[index]
  })

  // Now handle the actual content to be injected in resource, by parsing buffer
  return save({ type, newUploads, body, uploads })
}
