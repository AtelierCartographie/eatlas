'use strict'

const {
  find,
} = require('../es-client')('topic')

exports.list = () => find()



