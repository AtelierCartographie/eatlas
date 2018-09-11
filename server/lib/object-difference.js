'use strict'

const { transform, isEqual, isObject } = require('lodash')

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
module.exports = (object, base) => changes(object, base)

const changes = (object, base) =>
  transform(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] =
        isObject(value) && isObject(base[key])
          ? changes(value, base[key])
          : value
    }
  })
