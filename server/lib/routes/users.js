'use strict'

const { users } = require('../model')

exports.list = (req, res) =>
  users
    .list()
    .then(users => res.send(users))
    .catch(res.boom.send)

exports.findUser = (req, res, next) =>
  users
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        return res.boom.notFound('Unknown User Id')
      }
      req.foundUser = user
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundUser)

exports.update = (req, res) =>
  users
    .update(req.foundUser.id, req.body)
    .then(updatedUser => res.send(updatedUser))
    .catch(res.boom.send)

exports.add = (req, res) =>
  users
    .create(req.body)
    .then(user => res.send(user))
    .catch(res.boom.send)

exports.remove = (req, res) =>
  users
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(res.boom.send)
