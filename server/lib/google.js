'use strict'

const { auth: { OAuth2 } } = require('googleapis')
const { google: conf } = require('config')
const { promisify } = require('util')
const request = require('request-promise-native')

const client = new OAuth2(conf.clientId)

exports.verify = promisify((idToken, cb) =>
  client.verifyIdToken(idToken, null, cb),
)

const getFileUrl = (fileId, type, mimeType) => {
  const exportTrigger = conf.exportTrigger[type]
  const shouldExport =
    Array.isArray(exportTrigger) && exportTrigger.includes(mimeType)
  const exportFormat = shouldExport && conf.exportFormat[type]
  const url = exportFormat ? conf.exportUrl : conf.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

exports.download = async (fileId, type, mimeType, accessToken) => {
  const url = getFileUrl(fileId, type, mimeType)
  const options = { encoding: null, auth: { bearer: accessToken } }
  return request(url, options)
}
