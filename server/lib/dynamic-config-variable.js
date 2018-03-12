'use strict'

const config = require('config')
const { template } = require('lodash')

const TPL_SETTINGS = {
  interpolate: /\$([a-zA-Z0-9_]+)/g,
}

const cache = new Map()

const compile = string => {
  if (cache.has(string)) {
    return cache.get(string)
  }
  const f = template(string, TPL_SETTINGS)
  cache.set(string, f)
  return f
}

module.exports = (key, locals = {}) =>
  compile(config.get(key))(Object.assign(config.util.toObject(), locals))
