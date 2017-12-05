'use strict'

const schemas = require('../schemas')

const users = [
  {
    id: 1,
    name: 'user_1',
    email: 'user_1@example.com',
    role: 'admin',
  },
  {
    id: 2,
    name: 'user_2',
    email: 'user_2@example.com',
    role: 'admin',
  },
]

exports.list = (req, res) => {
  res.send(users)
}

exports.findUser = (req, res, next) => {
  const found = users.find(u => u.id === Number(req.params.id))
  if (!found) {
    return res.boom.notFound('Unknown User Id')
  }

  req.foundUser = found
  return next()
}

exports.get = (req, res) => {
  res.send(req.foundUser)
}

exports.update = (req, res) => {
  Object.assign(req.foundUser, req.body)
  res.send(req.foundUser)
}
exports.update.schema = schemas.user

exports.add = (req, res) => {
  const id = Math.max(...users.map(u => u.id)) + 1
  const user = req.body
}
exports.add.schema = schemas.user
