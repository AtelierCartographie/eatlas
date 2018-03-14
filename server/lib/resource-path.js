'use strict'

const path = require('path')
const { articleFileName } = require('./article-utils')
const getConf = require('./dynamic-config-variable')

const guessFileName = resource => {
  if (typeof resource !== 'object') {
    throw new Error('Cannot guess file name without full resource object')
  }
  if (resource.type === 'article' || resource.type === 'focus') {
    return articleFileName(resource)
  }
  if (resource.type === 'sound') {
    return resource.file
  }
  if (resource.type === 'image' || resource.type === 'map') {
    throw new Error('Cannot guess file name for image or map (multiple files)')
  }
  if (resource.type === 'definition' || resource.type === 'video') {
    throw new Error('Cannot guess file name for lexicon or video (no file)')
  }
  throw new Error(
    'Cannot guess file name for unknown type "' + resource.type + '"',
  )
}

module.exports = (
  typeOrResource,
  file = null,
  { up = true, pub = true } = {},
) => {
  const type =
    typeof typeOrResource === 'object' ? typeOrResource.type : typeOrResource
  const fileName = file || guessFileName(typeOrResource)
  const result = { up: null, pub: null }
  const root = path.join(__dirname, '..')
  if (up) {
    const upDir = path.resolve(root, getConf('uploadPath', {}))
    result.up = path.join(upDir, fileName)
  }
  if (pub) {
    const pubDir = path.resolve(root, getConf('publicPath.' + type))
    result.pub = path.join(pubDir, fileName)
  }
  return result
}
