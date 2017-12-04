'use strict'

const Joi = require('joi')
const { verify } = require('../google')
const { getRole } = require('../model')

exports.session = (req, res) => {
  if (!req.session.user) {
    return res.boom.forbidden('Not authenticated')
  }

  // Always grab role dynamically
  const { name, email } = req.session.user
  getRole(email)
    .then(role => res.send({ name, email, role }))
    .catch(err => res.boom.badImplementation(err))
}

exports.login = (req, res) => {
  verify(req.body.token.id_token)
    .then(envelope => envelope.getPayload())
    .then(({ name, email }) => getRole(email).then(role => ({ name, email, role })))
    .then(({ name, email, role }) => {
      req.session.user = { name, email }
      // TODO grab role from user info
      res.send({ name, email, role })
    })
    .catch(err => res.boom.forbidden(`Authentication failed: ${err.message}`))
}

exports.login.schema = {
  token: Joi.object().keys({
    //access_token: Joi.string(),
    id_token: Joi.string(),
    //login_hint: Joi.string(),
    //idpId: Joi.string(),
    //token_type: Joi.string(),
    //scope: Joi.string(),
    //expires_at: Joi.number(),
    //expires_in: Joi.number(),
    //first_issued_at: Joi.number(),
  })
}
