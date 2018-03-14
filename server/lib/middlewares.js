'use strict'

const config = require('config')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const cors = require('cors')
const { validate } = require('./schemas')
const logger = require('./logger').child({ domain: 'app' })
const debugCors = require('debug')('eatlas:cors')

exports.cors = cors({
  origin: (origin, cb) => {
    if (!origin && config.cors.allowNoOrigin) {
      debugCors('No origin & allowNoOrigin: OK')
      return cb(null, true)
    }
    const origins = config.cors.origins.map(origin => {
      if (origin === '$publicUrl') {
        return config.publicUrl
      }
      return origin
    })
    const ok = origins.includes(origin)
    debugCors({ origin, origins, ok })
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'))
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

exports.resBoomSend = (req, res, next) => {
  if (res.boom) {
    res.boom.send = (err, additionalData = {}) => {
      if (err.isJoi) {
        res.boom.badRequest(err.message, {
          details: err.details,
          object: err._object,
          annotated: err.annotate(),
        })
        return
      }

      const boomed = err.isBoom
        ? err
        : res.boom.create(err.status || 500, err.message || String(err))
      const payload = Object.assign(boomed.output.payload, additionalData, {
        message: err.message,
        details: err.details,
      })
      res.status(boomed.output.statusCode).send(payload)

      // Log server errors
      if (payload.statusCode === 500) {
        logger.error(err)
      }
    }
  }
  next()
}
