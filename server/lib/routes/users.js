'use strict'

const schemas = require('../schemas')
const { listUsers, addUser, updateUser, findUserById } = require('../model')

exports.list = (req, res) =>
  listUsers()
    .then(users => res.send(users))
    .catch(err => res.boom.badImplementation(err))

exports.findUser = (req, res, next) =>
  findUserById(Number(req.params.id))
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
  updateUser(req.foundUser.id, req.body)
    .then(updatedUser => res.send(updatedUser))
    .catch(err => res.boom.badImplementation(err))
exports.update.schema = schemas.user

exports.add = (req, res) =>
  addUser(req.body)
    .then(user => res.send(user))
    .catch(err => res.boom.badImplementation(err))
exports.add.schema = schemas.user
