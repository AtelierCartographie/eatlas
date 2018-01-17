'use strict'

const config = require('config')
const mime = require('mime')
const { writeFile, ensureDir } = require('fs-extra')
const path = require('path')

exports.saveMedia = async ({ id, type, upload: { mimeType, key, buffer } }) => {
  const fileDir = config.publicPath[type]
  if (!fileDir) {
    throw new Error('Unknown storage directory for this type "' + type + '"')
  }

  const extension = mime.getExtension(mimeType)
  if (!extension) {
    throw new Error('Unknown mime type "' + mimeType + '"')
  }

  const absFileDir = path.resolve(__dirname, '..', fileDir)
  const fileName = id + '.' + extension
  const absFilePath = path.join(absFileDir, fileName)

  await ensureDir(absFileDir)
  await writeFile(absFilePath, buffer)

  return {
    file: fileName,
  }
}
