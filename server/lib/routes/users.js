'use strict'

const { users } = require('../model')

exports.list = (req, res) =>
  users
    .find()
    .then(users => res.send(users))
    .catch(err => res.boom.badImplementation(err))

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
    .catch(err => res.boom.badImplementation(err))

exports.get = (req, res) => res.send(req.foundUser)

exports.update = (req, res) =>
  users
    .update(req.foundUser.id, req.body)
    .then(updatedUser => res.send(updatedUser))
    .catch(err => res.boom.badImplementation(err))

exports.add = (req, res) =>
  users
    .create(req.body)
    .then(user => res.send(user))
    .catch(err => res.boom.badImplementation(err))

exports.remove = (req, res) =>
  users
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.boom.badImplementation(err))
