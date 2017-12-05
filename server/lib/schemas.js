'use strict'

const Joi = require('joi')

exports.user = {
  name: Joi.string()
    .min(2)
    .max(250)
    .required(),
  email: Joi.string()
    .email()
    .required(),
  role: Joi.string().valid(['admin', 'visitor']),
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
