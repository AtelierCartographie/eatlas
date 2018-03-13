'use strict'

const mime = require('mime')
const {
  writeFile,
  ensureDir,
  copy,
  symlink,
  unlink,
  exists,
} = require('fs-extra')
const path = require('path')
const config = require('config')
const { publishArticle, unpublishArticle } = require('./publish-article')
const getConf = require('./dynamic-config-variable')
const resourcePath = require('./resource-path')
const debug = require('debug')('eatlas:fs')

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

  debug('Write', absFilePath)

  await ensureDir(absFileDir)
  await writeFile(absFilePath, buffer)
}

exports.deleteAllFiles = async resource => {
  if (config.keepUploadsOnDelete) {
    debug('Remove', 'nope: keepUploadsOnDelete is true')
    return resource
  }
  // Delete public files
  await unpublish(resource)
  // Then delete uploaded files
  const files = uploadManagers[resource.type].files(resource)
  await Promise.all(
    files.map(async file => {
      const { up } = resourcePath(resource, file, { pub: false })
      debug('Remove', up)
      await unlink(up)
    }),
  )
  return resource
}

exports.updateFilesLocations = async resource =>
  resource.status === 'published' ? publish(resource) : unpublish(resource)

exports.copyPublic = async (up, pub) => {
  // TODO check if paths are actually in 'uploadPath' and one of 'publicPaths'?
  if (config.publishFileCommand === 'symlink') {
    if (await exists(pub)) {
      await unlink(pub)
    }
    debug('Symlink', { from: up, to: pub })
    await symlink(up, pub)
  } else {
    debug('Copy', { from: up, to: pub })
    await copy(up, pub)
  }
}

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
      await exports.copyPublic(up, pub)
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
        debug('Remove', pub)
        await unlink(pub)
      }
    }),
  )

  return resource
}
