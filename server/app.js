'use strict'

const express = require('express')
const boom = require('express-boom')
const bodyParser = require('body-parser')

const {
  cors,
  session,
  validateBody,
  logBoom500,
  resBoomSend,
} = require('./lib/middlewares')
const { user, users, resources, topics, parsers } = require('./lib/routes')

const app = express()

app.use(cors)
app.use(session)
app.use(boom())
app.use(resBoomSend)
app.use(logBoom500)
app.use(bodyParser.json())

app.get('/session', user.session)
app.post('/login', validateBody(user.login))

app.get('/users', users.list)
app.get('/users/:id', users.findUser, users.get)
app.post('/users/:id', users.findUser, users.update)
app.post('/users', users.add)
app.delete('/users/:id', users.findUser, users.remove)

app.post('/parse/article', parsers.article)

app.get('/resources', resources.list)
app.get('/resources/:id/preview', resources.findResource, resources.preview)
app.get('/resources/:id/previewssr', resources.findResource, resources.previewSSR)
app.get('/resources/:id', resources.findResource, resources.get)
app.post('/resources', validateBody(resources.addFromGoogle))
app.post('/resources/:id', resources.findResource, resources.update)
app.delete('/resources/:id', resources.findResource, resources.remove)

app.get('/topics', topics.list)

module.exports = app
