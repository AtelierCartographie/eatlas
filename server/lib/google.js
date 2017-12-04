'use strict'

const { auth: { OAuth2 } } = require('googleapis')
const { google: { clientId } } = require('config')
const { promisify } = require('util')

const client = new OAuth2(clientId)

exports.verify = promisify((idToken, cb) => client.verifyIdToken(idToken, null, cb))
