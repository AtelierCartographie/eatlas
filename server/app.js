'use strict'

const express = require('express')
const boom = require('express-boom')
const bodyParser = require('body-parser')

const { cors, session, validateBody, logBoom500 } = require('./lib/middlewares')
const { user, users, resources } = require('./lib/routes')

const app = express()

app.use(cors)
app.use(session)
app.use(boom())
app.use(logBoom500)
app.use(bodyParser.json())

app.get('/session', user.session)
app.post('/login', validateBody(user.login))

app.get('/users', users.list)
app.get('/users/:id', users.findUser, users.get)
app.post('/users/:id', users.findUser, users.update)
app.post('/users', users.add)
app.delete('/users/:id', users.findUser, users.remove)

app.get('/resources', resources.list)
app.get('/resources/:id', resources.findResource, resources.get)
app.post('/resources/google-drive', validateBody(resources.addFromGoogle))
app.delete('/resources/:id', resources.findResource, resources.remove)

module.exports = app
