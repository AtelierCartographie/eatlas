'use strict'

const Joi = require('joi')
const { promisify } = require('util')

const validateP = promisify(Joi.validate)
exports.validate = (value, schema) => validateP(value, schema)

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

const defaultUserName = ({ email }) => email.replace(/@.*$/, '')
defaultUserName.description = 'left part of email'

exports.fullUser = {
  name: Joi.string()
    .min(2)
    .max(250)
    .default(defaultUserName),
  email: Joi.string()
    .email()
    .required(),
  role: Joi.string()
    .valid(['admin', 'visitor'])
    .default('visitor'),
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

exports.fullResource = {
  nodes: Joi.array()
    .items(
      Joi.object().keys({
        type: Joi.string().required(),
        text: Joi.string(),
        list: Joi.array()
          .items(Joi.string().required())
          .when('type', {
            is: Joi.valid(['meta', 'footnotes']),
            otherwise: Joi.forbidden(),
          })
          .when('type', {
            is: Joi.valid('footnotes'),
            then: Joi.required(),
          }),
        id: Joi.string().when('type', {
          is: Joi.valid(['resource', 'meta']),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),
      }),
    )
    .required(),
}
