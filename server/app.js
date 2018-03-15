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
const { user, users, resources, topics, parsers } = require('./lib/routes')
const { generateIndexHTML } = require('./lib/html-generator')

const app = express()

app.use(cors)
app.use(session)
app.use(boom())
app.use(resBoomSend)
app.use(bodyParser.json())

app.get('/session', user.session)
app.post('/login', validateBody(user.login))

app.get('/users', users.list)
app.post('/users', users.add)
app.get('/users/:id', users.findUser, users.get)
app.put('/users/:id', users.findUser, users.update)
app.delete('/users/:id', users.findUser, users.remove)

app.post('/parse/article', parsers.article)
app.post('/parse/focus', parsers.focus)
app.post('/parse/lexicon', parsers.lexicon)

app.get('/resources', resources.list)
app.get('/resources/:id/preview', resources.findResource, resources.preview)
app.get('/resources/:id/file/:k?', resources.findResource, resources.file)
app.get('/resources/:id', resources.findResource, resources.get)
app.post('/resources/google-drive', validateBody(resources.addFromGoogle))
app.post('/resources', validateBody(resources.add))
app.put('/resources/:id', resources.findResource, resources.update) // TODO body schema
app.delete('/resources/:id', resources.findResource, resources.remove)

app.get('/topics', topics.list)
app.get('/topics/:id/preview', topics.findTopic, topics.preview)
app.get('/topics/:id', topics.findTopic, topics.get)
app.post('/topics', topics.add)
app.put('/topics/:id', topics.findTopic, topics.update)
app.delete('/topics/:id', topics.findTopic, topics.remove)

// TODO switch /preview suffix of above routes to a prefix like the route below
app.get('/preview', async (req, res) => {
  const html = await generateIndexHTML({ preview: true })
  res.send(html)
})

module.exports = app
