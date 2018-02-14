'use strict'

const { email: _email, fullUser, userUpdate, validate } = require('../schemas')

const {
  find,
  findOne,
  findById,
  insert,
  update,
  remove,
} = require('../es/client')('user')

exports.findByEmail = email =>
  validate(email, _email).then(email => findOne({ query: { term: { email } } }))

exports.list = find

exports.findById = findById

exports.create = user =>
  validate(user, fullUser).then(user =>
    exports
      .findByEmail(user.email)
      .then(
        found =>
          found
            ? Promise.reject(new Error('Invalid Email (already exists)'))
            : insert(user),
      ),
  )

exports.update = (id, doc) =>
  validate(doc, userUpdate).then(doc => update(id, doc))

exports.remove = remove
