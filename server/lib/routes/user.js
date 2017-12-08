'use strict'

const schemas = require('../schemas')
const { verify } = require('../google')
const { users } = require('../model')

exports.session = (req, res) => {
  if (!req.session.user) {
    return res.boom.forbidden('Not authenticated')
  }

  // Always grab role dynamically, even if already in session (we want this to be always up to date)
  const { email } = req.session.user
  users
    .findByEmail(email)
    .then(user => {
      if (!user) {
        return res.boom.notFound('Invalid user: account deleted)')
      }
      return res.send(user)
    })
    .catch(res.boom.send)
}

exports.login = (req, res) => {
  verify(req.body.token.id_token)
    .then(envelope => envelope.getPayload())
    .then(({ email }) => users.findByEmail(email))
    .then(user => user || Promise.reject(new Error('Uknown User')))
    .then(user => {
      req.session.user = user
      res.send(user)
    })
    .catch(err => res.boom.forbidden(`Authentication failed: ${err.message}`))
}
exports.login.schema = schemas.googleOauth
