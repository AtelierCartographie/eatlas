'use strict'

const path = require('path')
const getConf = require('./dynamic-config-variable')
const { slugify } = require('../../client/src/universal-utils')
const debug = require('debug')('eatlas:path')

const root = path.join(__dirname, '..')
const pubDir = path.resolve(root, getConf('publicPath'))
const upDir = path.resolve(root, getConf('uploadPath', {}))

const getTypeLabel = ({ type }) =>
  ({
    map: 'carte',
    sound: 'audio',
    image: 'photo',
  }[type] || type)

const getTopicSlug = (resource, topics) => {
  const topic = resource.topic
    ? topics.find(({ id }) => String(id) === String(resource.topic))
    : resource
  if (!topic || !topic.name) {
    debug({ resource, topics })
    throw new Error('Topic not found')
  }
  return slugify(topic.name)
}

const getResourceSlug = resource =>
  resource && resource.title && slugify(resource.title)

// Public path to HTML page
exports.pagePath = (key, resource, topics, params = {}) => {
  const locals = {
    typeLabel: resource ? getTypeLabel(resource) : key,
    topicSlug: resource
      ? // No topic can be found for definitions
        key === 'definition'
        ? ''
        : getTopicSlug(resource, topics)
      : '',
    resourceSlug: resource ? getResourceSlug(resource) : '',
    ...params,
    ...(resource || {}),
  }
  return path.resolve(
    __dirname,
    '..',
    getConf('publicPath'),
    getConf('pageUrls.' + key, locals),
  )
}

// Public and private paths to uploaded media file
exports.resourceMediaPath = (
  typeOrResource,
  file = null,
  { up = true, pub = true } = {},
) => {
  const resource = typeof typeOrResource === 'object' ? typeOrResource : null
  const type = resource ? resource.type : typeOrResource
  if (type !== 'image' && type !== 'sound' && type !== 'map') {
    return {} // No media
  }
  const basename = file || resource.file
  if (!basename) {
    throw new Error('Could not get basename: file could not be guessed')
  }
  const result = { up: null, pub: null }
  if (up) {
    result.up = path.join(upDir, basename)
  }
  if (pub) {
    result.pub = path.join(pubDir, getConf('mediaSubPath'), basename)
  }
  return result
}

exports.pathToUrl = filePath =>
  filePath && getConf('publicUrl') + '/' + path.relative(pubDir, filePath)
