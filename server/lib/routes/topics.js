'use strict'

const { topics } = require('../model')

exports.list = (req, res) =>
  topics
    .list()
    .then(topics=> res.send(topics))
    .catch(res.boom.send)

