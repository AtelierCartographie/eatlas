'use strict'

const chalk = require('chalk')
const ora = require('ora')
const { ready } = require('../lib/es/client')
const model = require('../lib/model')
const fs = require('fs-extra')
const home = require('user-home')
const path = require('path')

let repl = null

const historyFile = path.join(home, '.eatlas_model_repl_history')
const historySize = 25

const welcome = `

REPL will wait for async operations and store result in "_"
Available models: Resources, Users, Topics

`

const start = () => {
  const replLocals = {
    Resources: model.resources,
    Users: model.users,
    Topics: model.topics,
    fs, // replace loaded core fs module
  }

  process.stdout.write(chalk.dim(welcome))

  repl = require('repl').start({ prompt: 'eatlas-model > ' })
  repl.eval = asyncEval(repl.eval)

  if (fs.existsSync(historyFile)) {
    readHistory()
  }
  repl.on('exit', saveHistory)

  Object.assign(repl.context, replLocals)
}

const asyncEval = _eval => (cmd, context, fileName, cb) =>
  _eval(cmd, context, fileName, (err, value) => {
    if (err) {
      return cb(err)
    }
    if (value && typeof value.then === 'function') {
      const spinner = ora(chalk.dim('Pending async operation…')).start()
      value.then(
        v => {
          spinner.succeed(chalk.dim('Value available as _'))
          cb(undefined, v)
        },
        err => {
          spinner.fail(chalk.dim('Operation failed'))
          cb(err)
        },
      )
    } else {
      cb(err, value)
    }
  })

const readHistory = () =>
  fs
    .readFileSync(historyFile, 'utf-8')
    .split('\n')
    .reverse()
    .filter(line => line.trim())
    .forEach(line => repl.history.push(line))

const saveHistory = () =>
  fs.writeFileSync(
    historyFile,
    repl.history
      .slice()
      .reverse()
      .slice(-historySize)
      .map(line => line.trim())
      .filter(line => line)
      .join('\n'),
  )

ready.then(start)
