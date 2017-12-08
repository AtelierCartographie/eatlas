'use strict'

const bunyan = require('bunyan')
const config = require('config')

const defaults = {
  streams: [
    // TODO configure streams from 'config' object
    {
      level: 'info',
      stream: process.stdout,
    },
    {
      level: 'fatal',
      stream: process.stderr,
    },
  ],
  name: 'eatlas',
  level: 'info', // trace|debug|info|warn|error|fatal
  src: false,
}

module.exports = bunyan.createLogger(Object.assign({}, defaults, config.logger))
