'use strict'

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
const { resourceMediaPath } = require('./resource-path')
const debug = require('debug')('eatlas:fs')

// Circular dependency
let uploadManagers = {}
setImmediate(() => (uploadManagers = require('./upload-managers')))

exports.saveAs = async (fileName, fileDir, buffer) => {
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
      const { up } = resourceMediaPath(resource, file, { pub: false })
      debug('Remove', up)
      await unlink(up)
    }),
  )
  return resource
}

exports.updateFiles = async resource =>
  resource.status === 'published' ? publish(resource) : unpublish(resource)

exports.copyPublic = async (up, pub) => {
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
  const { files: getFiles } = uploadManagers[resource.type]
  await Promise.all(
    getFiles(resource).map(async file => {
      const { up, pub, upFull, pubFull } = resourceMediaPath(resource, file, {
        up: true,
        pub: true,
        full: true,
      })
      await ensureDir(path.dirname(pub))
      await exports.copyPublic(up, pub)
      if (upFull) {
        await ensureDir(path.dirname(pubFull))
        await exports.copyPublic(upFull, pubFull)
      }
    }),
  )

  return resource
}

// Unpublish files = remove from publicPath
const unpublish = async resource => {
  const { files: getFiles } = uploadManagers[resource.type]
  await Promise.all(
    getFiles(resource).map(async file => {
      const { pub } = resourceMediaPath(resource, file, { up: false })
      if (await exists(pub)) {
        debug('Remove', pub)
        await unlink(pub)
      }
    }),
  )

  return resource
}
