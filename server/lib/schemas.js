'use strict'

const Joi = require('joi')
const { promisify } = require('util')
const { META_LIST_EXPECTED } = require('../../client/src/universal-utils')

const validateP = promisify(Joi.validate)
exports.validate = (value, schema) => validateP(value, schema)

// users

exports.email = Joi.string()
  .email()
  .required()

const name = Joi.string()
  .min(2)
  .max(250)

exports.userUpdate = {
  name,
  email: Joi.string().email(),
  role: Joi.string().valid(['admin', 'visitor']),
}

const defaultUserName = ({ email }) => email.replace(/@.*$/, '')
defaultUserName.description = 'left part of email'

exports.fullUser = {
  name: name.default(defaultUserName),
  email: exports.email,
  role: Joi.string()
    .valid(['admin', 'visitor'])
    .default('visitor'),
}

// topics

exports.fullTopic = {
  // beware, id can be 0
  id: Joi.number()
    .min(0)
    .max(999)
    .required(),
  name,
  // https://github.com/hapijs/joi/issues/482
  resourceId: Joi.string().allow(''),
  description_fr: Joi.string().allow(''),
  description_en: Joi.string().allow(''),
}

// resources

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

const resourceType = Joi.string().valid(
  // Real types
  ['article', 'definition', 'focus', 'map', 'sound', 'image', 'video']
    // Virtual types
    .concat(['single-definition']),
)

const resourceStatus = Joi.string().valid([
  'submitted',
  'validated',
  'published',
  'deleted',
])

// TODO probably extend to other providers: youtube…
const resourceMediaUrl = Joi.string().regex(/^https:\/\/vimeo.com\/[0-9]+$/)

const upload = Joi.object().keys({
  fileId: Joi.string().required(),
  mimeType: Joi.string().required(),
  key: Joi.string().required(),
})

const language = Joi.string()

const resourceTitlePosition = Joi.string().valid(['center', 'top', 'bottom'])

const transcript = Joi.string().when('type', {
  is: Joi.valid(['sound', 'video']),
  then: Joi.allow('').allow(null).optional(),
  otherwise: Joi.forbidden(),
})

exports.resource = {
  id: Joi.string().required(),
  type: resourceType.required(),
  author: Joi.string().when('type', {
    is: Joi.valid(['article', 'focus']),
    then: Joi.required(),
    otherwise: Joi.allow(null).optional(),
  }),
  title: Joi.string().required(),
  titlePosition: resourceTitlePosition.when('type', {
    is: Joi.valid(['article', 'focus']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  subtitle: Joi.string().allow(null).optional(),
  topic: Joi.string().when('type', {
    is: Joi.valid(['definition']),
    then: Joi.allow(null).optional(),
    otherwise: Joi.required(),
  }),
  language: language.required(),
  description: Joi.string()
    .allow('')
    .allow(null).optional(),
  transcript,
  copyright: Joi.string().allow(null).optional(),
  mediaUrl: resourceMediaUrl.allow(null).optional(),
  visiblePublishedAt: Joi.date()
    .timestamp()
    .allow(null).optional(),
}

exports.uploadFromGoogleDrive = {
  ...exports.resource,
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

const markup = Joi.object().keys({
  type: Joi.string().required(),
  text: Joi.string().required(),
  url: Joi.string().when('type', {
    is: Joi.valid('link'),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
})

const list = Joi.array().items(
  Joi.object().keys({
    text: Joi.string().required(),
    markup: Joi.array().items(markup),
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
  markup: Joi.array().items(markup),
})

const definition = Joi.object().keys({
  dt: Joi.string().required(),
  dd: Joi.string().required(),
  aliases: Joi.array()
    .items(Joi.string())
    .default([]),
})

const densities = Joi.object().keys({
  '1x': Joi.string().required(),
  '2x': Joi.string(),
  '3x': Joi.string(),
})

const images = Joi.object().keys({
  small: densities,
  medium: densities,
  large: densities,
})

const meta = Joi.object().keys({
  type: Joi.string().required(),
  text: Joi.string(),
  list: list.when('type', {
    is: Joi.valid(META_LIST_EXPECTED),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
})

exports.fullResource = {
  id: Joi.string().required(),
  type: resourceType.required(),

  // metadata
  author: Joi.string().when('type', {
    is: Joi.valid(['article', 'focus']),
    then: Joi.required(),
    otherwise: Joi.allow(null).optional(),
  }),
  title: Joi.string().required(),
  titlePosition: resourceTitlePosition.when('type', {
    is: Joi.valid(['article', 'focus']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  subtitle: Joi.string().when('type', {
    is: Joi.valid(['article', 'focus', 'map']),
    then: Joi.allow(null).optional(),
    otherwise: Joi.forbidden(),
  }),
  topic: Joi.string().when('type', {
    is: Joi.valid(['definition', 'single-definition']),
    then: Joi.allow(null).optional(),
    otherwise: Joi.required(),
  }),
  language: language.required(),
  description: Joi.string()
    .allow('')
    .allow(null).optional(),
  transcript,
  copyright: Joi.string().when('type', {
    is: Joi.valid(['definition', 'map', 'image', 'video', 'sound']),
    then: Joi.allow(null).optional(),
    otherwise: Joi.forbidden(),
  }),
  status: resourceStatus.required(),

  nodes: Joi.array()
    .items(node)
    .when('type', {
      is: Joi.valid(['article', 'focus']),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  metas: Joi.array()
    .items(meta)
    .when('type', {
      is: Joi.valid(['article', 'focus', 'single-definition']),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  definitions: Joi.array()
    .items(definition)
    .when('type', {
      is: Joi.valid(['definition']),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  file: Joi.string().when('type', {
    is: Joi.valid(['sound']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  images: images.when('type', {
    is: Joi.valid(['image', 'map']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  mediaUrl: resourceMediaUrl.when('type', {
    is: Joi.valid(['video']),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  visiblePublishedAt: Joi.date()
    .timestamp()
    .allow(null).optional(),

  // track changes
  updatedBy: exports.email,
  createdAt: Joi.date()
    .timestamp()
    .required(),
  updatedAt: Joi.date()
    .timestamp()
    .allow(null).optional(),
  publishedAt: Joi.date()
    .timestamp()
    .allow(null).optional(),
}
