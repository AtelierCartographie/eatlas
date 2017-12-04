'use strict'

const express = require('express')
const config = require('config')
const session = require('express-session')
const boom = require('express-boom')
const bodyParser = require('body-parser')
const cors = require('cors')
const validate = require('express-joi-validate')

const routes = require('./lib/routes')

const app = express()

app.use(cors({
  origin: (origin, cb) => {
    if (config.cors.origins.includes(origin)) {
      return cb(null, true)
    }
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true, // required for fetch({ credentials: 'include' })
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}))

app.use(session(Object.assign({
  resave: true,
  saveUninitialized: false,
}, config.session)))

app.use(boom())

app.use(bodyParser.json())

app.get('/session', routes.user.session)
app.post('/login', validate(routes.user.login.schema), routes.user.login)

module.exports = app
