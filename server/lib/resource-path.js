'use strict'

const path = require('path')
const getConf = require('./dynamic-config-variable')
const { slugify, topicName } = require('../../client/src/universal-utils')
const debug = require('debug')('eatlas:path')
const { accessSync } = require('fs')
const getTypeLabel = require('./i18n-type-labels')

const root = path.join(__dirname, '..')
const pubDir = path.resolve(root, getConf('publicPath'))
const upDir = path.resolve(root, getConf('uploadPath', {}))

const getTopicSlug = (resource, topics, lang = 'fr') => {
  const topic = resource.topic
    ? topics.find(({ id }) => String(id) === String(resource.topic))
    : resource
  const name = topicName(topic, lang)
  if (!topic || !name) {
    debug({ resource, topics })
    throw new Error('Topic not found')
  }
  return slugify(name)
}

const getResourceSlug = resource =>
  resource && resource.title && slugify(resource.title)

// Public path to HTML page
exports.pagePath = (key, resource, topics, params = {}) => {
  const locals = {
    typeLabel: resource ? getTypeLabel(resource.type, params.lang) : key,
    topicSlug: resource
      ? // No topic can be found for definitions
        key === 'definition'
        ? ''
        : getTopicSlug(resource, topics, params.lang)
      : '',
    resourceSlug: resource ? getResourceSlug(resource) : '',
    ...params,
    ...(resource || {}),
  }
  return exports.publicPath(
    getConf(`pageUrls.${params.lang || 'fr'}.${key}`, locals),
  )
}

exports.publicPath = filePath =>
  path.resolve(__dirname, '..', getConf('publicPath'), filePath)

// Public and private paths to uploaded media file
exports.resourceMediaPath = (
  typeOrResource,
  file = null,
  { up = true, pub = true, full = false } = {},
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
  if (full) {
    // xxx.jpg → xxx-full.jpg
    // xxx@2x.jpg → xxx-full@2x.jpg
    const fullImageName = basename.replace(/([@-][0-9]+x)?(\..*)$/, '-full$1$2')
    const fullImagePath = path.join(upDir, fullImageName)
    try {
      accessSync(fullImagePath)
      result.upFull = fullImagePath
      result.pubFull = path.join(pubDir, getConf('mediaSubPath'), fullImageName)
    } catch (err) {
      // Full image does not exist
      result.full = false
    }
  }
  return result
}

exports.pathToUrl = (filePath, fullUrl = true) =>
  filePath &&
  (fullUrl ? getConf('publicUrl') : '') + '/' + path.relative(pubDir, filePath)
