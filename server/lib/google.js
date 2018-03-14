'use strict'

const { auth: { OAuth2 } } = require('googleapis')
const { google: conf } = require('config')
const { promisify } = require('util')
const request = require('request-promise-native')
const debug = require('debug')('eatlas:google')

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
  const url = exportFormat ? conf.exportUrl : conf.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

exports.download = async (fileId, type, mimeType, accessToken) => {
  const url = getFileUrl(fileId, type, mimeType)
  const options = { encoding: null, auth: { bearer: accessToken } }
  return request(url, options).catch(err => {
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
    debug('Download failed', err)
    throw err
  })
}
