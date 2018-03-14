'use strict'

const { auth: { OAuth2 } } = require('googleapis')
const { google: conf } = require('config')
const { promisify } = require('util')
const request = require('request-promise-native')
const debug = require('debug')('eatlas:google')
const logger = require('./logger')

const client = new OAuth2(conf.clientId)

exports.verify = promisify((idToken, cb) =>
  client.verifyIdToken(idToken, null, (err, result) => {
    if (err) {
      debug('Verify ID Token failed', err)
    }
    cb(err, result)
  }),
)

const getFileUrl = (fileId, type, mimeType) => {
  const exportTrigger = conf.exportTrigger[type]
  const shouldExport =
    Array.isArray(exportTrigger) && exportTrigger.includes(mimeType)
  const exportFormat = shouldExport && conf.exportFormat[type]
  if (shouldExport && !exportFormat) {
    logger.error(
      `config.google.exportTrigger.${type} is set, but you have not set config.google.exportFormat.${type}`,
    )
    throw new Error(
      'Could not build export URL, missing exportFormat in server configuration',
    )
  }
  const url = exportFormat ? conf.exportUrl : conf.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

exports.download = async (fileId, type, mimeType, accessToken) => {
  try {
    const url = getFileUrl(fileId, type, mimeType)
    const options = { encoding: null, auth: { bearer: accessToken } }
    return await request(url, options)
  } catch (err) {
    mutateGoogleError(err)
    const isFileNotDownloadable =
      Array.isArray(err.details) &&
      err.details.some(({ reason }) => reason === 'fileNotDownloadable')
    if (isFileNotDownloadable) {
      // Typically we're trying to download a file type that should be exported
      logger.error(`
DOWNLOAD ERROR: this happens usually when trying to download a file that should be exported instead
1. Check that config.google.exportTrigger.${type} contains "${mimeType}"
2. Check that config.google.exportFormat.${type} is properly set too
/DOWNLOAD ERROR
`)
    }
    debug('Download/Export failed', err)
    throw err
  }
}

const mutateGoogleError = err => {
  if (Buffer.isBuffer(err.error)) {
    // Reponse-like error: this leads to awful crappy useless message like
    // '401 - {"type":"Buffer","data":[123,10,32,34,101,114,…'
    // So we have to transform this message into something more readable
    let message = ''
    try {
      const json = JSON.parse(err.error)
      if (json.error) {
        err.details = json.error.errors
        message = json.error.message
      }
    } catch (err) {
      message = String(err.error)
    }
    err.message = `${err.statusCode} - ${message}`
  }
  // For smaller logs
  delete err.response
  delete err.request
}
