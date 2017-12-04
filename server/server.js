'use strict'

const { createServer } = require('http')
const { server: { host, port } } = require('config')

const app = require('./app')

const server = createServer(app)

server.on('error', err => {
  console.error(err)
  process.exit(1)
})

server.listen(port, host, () => {
  console.log(`Server ready: http://${host}:${port}`)
})

module.exports = server
