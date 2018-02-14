'use strict'

const { createServer } = require('http')
const { server: { host, port } } = require('config')
const { ready } = require('./lib/es/client')
const logger = require('./lib/logger').child({ domain: 'server' })

const app = require('./app')

const server = createServer(app)

server.on('error', err => {
  logger.error(err)
  process.exit(1)
})

ready.then(() => {
  server.listen(port, host, () => {
    logger.info(`Server ready: http://${host}:${port}`)
  })
})

module.exports = server
