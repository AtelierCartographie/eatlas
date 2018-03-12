'use strict'

const mime = require('mime')
const { writeFile, ensureDir } = require('fs-extra')
const path = require('path')
const { publishArticle, unpublishArticle } = require('./publish-article')
const getConf = require('./dynamic-config-variable')

exports.saveUpload = ({ id }) => async ({ mimeType, key, buffer }) => {
  const fileDir = getConf('uploadPath', {})

  const extension = mime.getExtension(mimeType)
  if (!extension) {
    throw new Error('Unknown mime type "' + mimeType + '"')
  }

  const fileName = id + '-' + key + '.' + extension
  await saveAs(fileName, fileDir, buffer)

  return fileName
}

const saveAs = async (fileName, fileDir, buffer) => {
  const absFileDir = path.resolve(__dirname, '..', fileDir)
  const absFilePath = path.join(absFileDir, fileName)

  await ensureDir(absFileDir)
  await writeFile(absFilePath, buffer)
}

exports.updateFilesLocations = async resource =>
  resource.status === 'published' ? publish(resource) : unpublish(resource)

// Publish files = copy to publicPath
const publish = async resource => {
  if (resource.type === 'article' || resource.type === 'focus') {
    return publishArticle(resource)
  }
}

// Unpublish files = remove from publicPath
const unpublish = async resource => {
  if (resource.type === 'article' || resource.type === 'focus') {
    return unpublishArticle(resource)
  }
}
