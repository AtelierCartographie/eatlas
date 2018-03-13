'use strict'

const mime = require('mime')
const { writeFile, ensureDir, copy, unlink, exists } = require('fs-extra')
const path = require('path')
const { publishArticle, unpublishArticle } = require('./publish-article')
const getConf = require('./dynamic-config-variable')
const resourcePath = require('./resource-path')

// Circular dependency
let uploadManagers = {}
setImmediate(() => (uploadManagers = require('./upload-managers')))

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

  const { files: getFiles } = uploadManagers[resource.type]

  await Promise.all(
    getFiles(resource).map(async file => {
      const { up, pub } = resourcePath(resource, file)
      await ensureDir(path.dirname(pub))
      await copy(up, pub)
    }),
  )

  return resource
}

// Unpublish files = remove from publicPath
const unpublish = async resource => {
  if (resource.type === 'article' || resource.type === 'focus') {
    return unpublishArticle(resource)
  }

  const { files: getFiles } = uploadManagers[resource.type]

  await Promise.all(
    getFiles(resource).map(async file => {
      const { pub } = resourcePath(resource, file, { up: false })
      if (await exists(pub)) {
        await unlink(pub)
      }
    }),
  )

  return resource
}
