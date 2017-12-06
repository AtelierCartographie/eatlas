'use strict'

const Joi = require('joi')
const { promisify } = require('util')

exports.validate = promisify(Joi.validate)

exports.email = Joi.string()
  .email()
  .required()

exports.userUpdate = {
  name: Joi.string()
    .min(2)
    .max(250),
  email: Joi.string().email(),
  role: Joi.string().valid(['admin', 'visitor']),
}

exports.fullUser = {
  name: Joi.string()
    .min(2)
    .max(250)
    .required(),
  email: Joi.string()
    .email()
    .required(),
  role: Joi.string()
    .valid(['admin', 'visitor'])
    .required(),
}

exports.googleOauth = {
  token: Joi.object().keys({
    id_token: Joi.string(),
    // Extra params
    access_token: Joi.any(),
    login_hint: Joi.any(),
    idpId: Joi.any(),
    token_type: Joi.any(),
    scope: Joi.any(),
    expires_at: Joi.any(),
    expires_in: Joi.any(),
    first_issued_at: Joi.any(),
    session_state: Joi.any(),
  }),
}

exports.uploadFromGoogleDrive = {
  fileId: Joi.string().required(),
  accessToken: Joi.string().required(),
}
