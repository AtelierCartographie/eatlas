#!/usr/bin/env node

'use strict'

/* eslint no-console:off */

const chalk = require('chalk')

const { validate, fullUser } = require('../lib/schemas')
const { users } = require('../lib/model')
const { ready } = require('../lib/es/client')

const help = () => `
Usage: ${chalk.dim('node bin/add-user')} <email> [name] [role]

  email = user's Google address for oauth
  name  = user's display name (default = email)
  role  = user's role (default = visitor)

`

if (['-h', '--help'].includes(process.argv[2])) {
  console.log(help())
  process.exit(0)
}

const [, , email, name, role] = process.argv

validate({ role, email, name }, fullUser)
  .then(ready)
  .then(user => users.create(user))
  .then(created => {
    console.log(chalk.green('User successfully added'))
    console.log(created)
    process.exit(0)
  })
  .catch(err => {
    if (err.isJoi) {
      console.error(chalk.red('Invalid options:'))
      err.details.forEach(({ message }) =>
        console.error('- ' + chalk.red(message)),
      )
      console.error(help())
    } else {
      console.error(chalk.red(err.message))
    }
    process.exit(1)
  })
