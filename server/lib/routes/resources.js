'use strict'

const merge = require('lodash.merge')
const get = require('lodash.get')

const { resources: Resources, topics: Topics } = require('../model')
const schemas = require('../schemas')
const { download } = require('../google')
const { updateFiles, deleteAllFiles } = require('../public-fs')
const uploadManagers = require('../upload-managers')
const { resourceMediaPath, pagePath, pathToUrl } = require('../resource-path')
const { rebuildAllHTML } = require('../site-builder')
const previews = require('./previews') // for alias resources.preview = previews.resource

exports.findResource = (allowNotFound = false) => (req, res, next) =>
  Resources.findById(req.params.id)
    .then(resource => {
      if (!resource && !allowNotFound) {
        return res.boom.notFound('Unknown Resource Id')
      }
      req.foundResource = resource
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundResource)

exports.update = async (req, res) => {
  const baseData = Object.assign(
    { updatedBy: req.session.user.email, updatedAt: Date.now() },
    req.body,
  )
  // Every field is a resource's field to be updated, except 'uploads' & 'accessToken'
  delete baseData.uploads
  delete baseData.accessToken

  // Published at?
  if (
    req.body.status === 'published' &&
    req.foundResource.status !== 'published'
  ) {
    baseData.publishedAt = Date.now()
  }

  const body = Object.assign({}, req.foundResource, { uploads: [] }, req.body)
  // TODO handle upload deletion
  handleUploads(body, false)
    .then(data => merge(baseData, data))
    .then(updates => Resources.update(req.foundResource.id, updates))
    .then(async resource => {
      const oldStatus = req.foundResource.status
      if (resource.status === 'published') {
        try {
          await updateFiles(resource)
          await rebuildAllHTML() // TODO handle error
        } catch (err) {
          await Resources.update(req.foundResource.id, { status: oldStatus })
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
  updatedAt: Date.now(),
  publishedAt: req.body.status === 'published' ? Date.now() : 0,
  createdAt: Date.now(),
  id: req.body.id,
  type: req.body.type,
  title: req.body.title,
  titlePosition: req.body.titlePosition,
  subtitle: req.body.subtitle,
  topic: req.body.topic,
  language: req.body.language,
  description_fr: req.body.description_fr || '',
  description_en: req.body.description_en || '',
  transcript: req.body.transcript,
  copyright: req.body.copyright,
  mediaUrl: req.body.mediaUrl,
  visiblePublishedAt: +new Date(req.body.visiblePublishedAt) || null,
  source: req.body.source || '',
})

exports.add = (req, res) => {
  const baseData = getBaseData(req)

  Resources.create(baseData)
    .then(updateFiles)
    .then(async resource => {
      if (resource.status === 'published') {
        await rebuildAllHTML() // TODO handle error
      }
      return resource
    })
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
    .then(Resources.create)
    .then(updateFiles)
    .then(async resource => {
      if (resource.status === 'published') {
        await rebuildAllHTML() // TODO handle error
      }
      return resource
    })
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
  Resources.list()
    .then(resources => res.send(resources))
    .catch(res.boom.send)

exports.remove = (req, res) =>
  Resources.remove(req.params.id)
    .then(() => deleteAllFiles(req.foundResource))
    .then(async () => {
      if (req.foundResource.status === 'published') {
        await rebuildAllHTML() // TODO handle error
      }
    })
    .then(() => res.status(204).end())
    .catch(res.boom.send)

exports.file = isFull => async (req, res, next) => {
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
          const keyMatch = req.params.k.match(/(small|medium|large)-([123]x)/)
          const keyPath = keyMatch
            ? keyMatch[1] + '.' + keyMatch[2]
            : req.params.k
          file = get(images, keyPath)
        } else {
          // Requested with no params = get smallest (used for thumbnail)
          file =
            get(images, 'small.1x') ||
            get(images, 'small.2x') ||
            get(images, 'small.3x') ||
            get(images, 'medium.1x') ||
            get(images, 'medium.2x') ||
            get(images, 'medium.3x') ||
            get(images, 'large.1x') ||
            get(images, 'large.2x') ||
            get(images, 'large.3x')
        }
        if (!file) {
          return res.boom.badRequest(
            'Image not found for requested size and density',
          )
        }
        const { up, upFull } = resourceMediaPath(req.foundResource, file, {
          pub: false,
          full: isFull,
          up: true,
        })
        return res.sendFile(upFull || up)
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

exports.preview = previews.resource

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

exports.urls = async (req, res, next) => {
  const resource = req.foundResource
  try {
    let urls = []
    // HTML page
    urls.push(
      pathToUrl(
        await pagePath(resource.type, resource, await Topics.list(), {
          lang: resource.language,
        }),
      ),
    )
    // Other URLs (media)
    switch (resource.type) {
      case 'image':
      case 'map':
        // images :: size => densities
        for (let size in resource.images) {
          // densites :: density => file
          for (let density in resource.images[size]) {
            const file = resource.images[size][density]
            urls.push(
              pathToUrl(resourceMediaPath(resource, file, { up: false }).pub),
            )
          }
        }
        break
      case 'sound':
        urls.push(
          pathToUrl(
            resourceMediaPath(resource, resource.file, { up: false }).pub,
          ),
        )
        break
      case 'video':
        urls.push(resource.mediaUrl)
        break
    }
    res.send(urls)
  } catch (err) {
    next(err)
  }
}
