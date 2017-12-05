'use strict'

const config = require('config')
const session = require('express-session')
const cors = require('cors')
const Joi = require('joi')

exports.cors = cors({
  origin: (origin, cb) => {
    if (config.cors.origins.includes(origin)) {
      return cb(null, true)
    }
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true, // required for fetch({ credentials: 'include' })
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
})

exports.session = session(
  Object.assign(
    {
      resave: true,
      saveUninitialized: false,
    },
    config.session,
  ),
)

exports.validateBody = handler => (req, res, next) => {
  if (!handler.schema) {
    throw new Error(
      'validateBody requires a "schema" property on passed handler',
    )
  }

  const { error, value } = Joi.validate(req.body, handler.schema)
  if (error) {
    return res.boom.badRequest(error.message, error)
  }

  req.body = value
  handler(req, res, next)
}
