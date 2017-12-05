'use strict'

const config = require('config')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const cors = require('cors')
const { validate } = require('./schemas')

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
      store: new RedisStore(config.redis),
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

  validate(req.body, handler.schema)
    .then(value => {
      req.body = value
      setImmediate(() => handler(req, res, next))
    })
    .catch(err => res.boom.badRequest(err))
}
