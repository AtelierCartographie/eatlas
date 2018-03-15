'use strict'

const path = require('path')
const getConf = require('./dynamic-config-variable')

// TODO
exports.pagePath = async typeOrResource => {
  const resource =
    typeof typeOrResource === 'object' ? typeOrResource.type : null
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
  const root = path.join(__dirname, '..')
  if (up) {
    const upDir = path.resolve(root, getConf('uploadPath', {}))
    result.up = path.join(upDir, basename)
  }
  if (pub) {
    const pubDir = path.resolve(root, getConf('publicPath'))
    result.pub = path.join(pubDir, getConf('mediaSubPath'), basename)
  }
  return result
}
