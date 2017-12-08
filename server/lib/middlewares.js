'use strict'

const config = require('config')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const cors = require('cors')
const { validate } = require('./schemas')

exports.cors = cors({
  origin: (origin, cb) => {
    if (!origin && config.cors.allowNoOrigin) {
      return cb(null, true)
    }
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

exports.validateBody = handler => {
  if (!handler.schema) {
    throw new Error(
      'validateBody requires a "schema" property on passed handler',
    )
  }

  return (req, res, next) =>
    validate(req.body, handler.schema)
      .then(value => {
        req.body = value
        setImmediate(() => handler(req, res, next))
      })
      .catch(err => res.boom.badRequest(err))
}

exports.logBoom500 = (req, res, next) => {
  const original = res.boom.badImplementation.bind(res.boom)
  res.boom.badImplementation = (...args) => {
    console.error('Error 500', ...args) // eslint-disable-line no-console
    original(...args)
  }
  next()
}

exports.resBoomSend = (req, res, next) => {
  if (res.boom) {
    res.boom.send = (err, additionalData = {}) => {
      const boomed = err.isBoom
        ? err
        : res.boom.create(err.status || 500, err.message || String(err))
      const payload = Object.assign(boomed.output.payload, additionalData)
      res.status(boomed.output.statusCode).send(payload)
    }
  }
  next()
}
