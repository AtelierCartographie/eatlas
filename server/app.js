'use strict'

const express = require('express')
const boom = require('express-boom')
const bodyParser = require('body-parser')

const {
  cors,
  session,
  validateBody,
  resBoomSend,
} = require('./lib/middlewares')
const {
  user,
  users,
  resources,
  topics,
  parsers,
  previews,
  search,
} = require('./lib/routes')

const app = express()

app.use(cors)
app.use(session)
app.use(boom())
app.use(resBoomSend)
app.use(bodyParser.json())

app.get('/session', user.private(), user.session)
app.post('/login', validateBody(user.login))

app.get('/users', user.private(), users.list)
app.post('/users', user.private('admin'), users.add)
app.get('/users/:id', user.private(), users.findUser, users.get)
app.put('/users/:id', user.private('admin'), users.findUser, users.update)
app.delete('/users/:id', user.private('admin'), users.findUser, users.remove)

app.post('/parse/article', user.private(), parsers.article)
app.post('/parse/focus', user.private(), parsers.focus)
app.post('/parse/lexicon', user.private(), parsers.lexicon)

app.get('/resources', user.private(), resources.list)
app.get(
  '/resources/:id/preview',
  user.private(),
  resources.findResource,
  resources.preview,
)
app.get(
  '/resources/:id/file/:k?',
  user.private(),
  resources.findResource,
  resources.file,
)
app.get('/resources/:id', user.private(), resources.findResource, resources.get)
app.get(
  '/resources/:id/urls',
  user.private(),
  resources.findResource,
  resources.urls,
)
app.post(
  '/resources/google-drive',
  user.private('admin'),
  validateBody(resources.addFromGoogle),
)
app.post('/resources', user.private('admin'), validateBody(resources.add))
app.put(
  '/resources/:id',
  user.private('admin'),
  resources.findResource,
  resources.update,
) // TODO body schema
app.delete(
  '/resources/:id',
  user.private('admin'),
  resources.findResource,
  resources.remove,
)

app.get('/topics', user.private(), topics.list)
app.get('/topics/:id/preview', user.private(), topics.findTopic, topics.preview)
app.get('/topics/:id', user.private(), topics.findTopic, topics.get)
app.post('/topics', user.private('admin'), topics.add)
app.put('/topics/:id', user.private('admin'), topics.findTopic, topics.update)
app.delete(
  '/topics/:id',
  user.private('admin'),
  topics.findTopic,
  topics.remove,
)

// Preview routes
// TODO stop using /resources/:id/preview and use /preview/resource/:id instead
app.get(
  '/preview/resources/:id',
  user.private(),
  resources.findResource,
  previews.resource,
)
app.get('/preview/:page?', user.private(), previews.page)
app.get('/preview/topics/:id', topics.findTopic, topics.preview)

// Public search API
app.post('/search', bodyParser.urlencoded({ extended: true }), search.search)

module.exports = app
