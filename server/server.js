'use strict'

const { createServer } = require('http')
const { server: { host, port } } = require('config')
const { ready } = require('./lib/es-client')
const chalk = require('chalk')

const app = require('./app')

const server = createServer(app)

server.on('error', err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})

ready.then(() => {
  server.listen(port, host, () => {
    console.log(chalk.bold.green(`Server ready: http://${host}:${port}`)) // eslint-disable-line no-console
  })
})

module.exports = server
