'use strict'

const config = require('config')
const mime = require('mime')
const { writeFile, ensureDir } = require('fs-extra')
const path = require('path')

exports.saveMedia = ({ id, type }) => async ({ mimeType, key, buffer }) => {
  const fileDir = config.publicPath[type].replace(
    /\$clientPath/,
    config.clientPath,
  )
  if (!fileDir) {
    throw new Error('Unknown storage directory for this type "' + type + '"')
  }

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
const publish = async resource => resource

// Unpublish files = remove from publicPath
const unpublish = async resource => resource
