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

// TODO missing types
const resourceType = Joi.string().valid([
  'article',
  'focus',
  'map',
  'image',
  'video',
  'sound',
])

const upload = Joi.object().keys({
  fileId: Joi.string().required(),
  mimeType: Joi.string().required(),
  key: Joi.string().required(),
})

exports.uploadFromGoogleDrive = {
  id: Joi.string().required(),
  type: resourceType.required(),
  accessToken: Joi.string().required(),
  uploads: Joi.array()
    .items(upload)
    .required(),
}

const links = Joi.array().items(
  Joi.object().keys({
    label: Joi.string().required(),
    url: Joi.string().required(),
  }),
)

const list = Joi.array().items(
  Joi.object().keys({
    text: Joi.string().required(),
    links,
  }),
)

const node = Joi.object().keys({
  type: Joi.string().required(),
  text: Joi.string(),
  list: list.when('type', {
    is: Joi.valid('footnotes'),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  id: Joi.string().when('type', {
    is: Joi.valid(['resource']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  links,
  lexicon: Joi.array().items(Joi.string()),
})

const meta = Joi.object().keys({
  type: Joi.string().required(),
  text: Joi.string(),
  list: list.when('type', {
    is: Joi.valid(['keywords', 'related', 'references']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
})

exports.fullResource = {
  id: Joi.string().required(),
  type: resourceType.required(),
  nodes: Joi.array()
    .items(node)
    .when('type', {
      is: Joi.valid(['article', 'focus']),
      then: Joi.required(),
    }),
  metas: Joi.array()
    .items(meta)
    .when('type', {
      is: Joi.valid(['article', 'focus']),
      then: Joi.required(),
    }),
  file: Joi.string().when('type', {
    is: Joi.valid(['image']),
    then: Joi.required(),
  }),
}
