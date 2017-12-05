'use strict'

// TODO elasticsearch

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

exports.listUsers = () => Promise.resolve(users)

exports.findUserByEmail = email => Promise.resolve(users[0]) // eslint-disable-line no-unused-vars

exports.findUserById = id => Promise.resolve(users.find(u => u.id === id))

exports.addUser = body => {
  const id = Math.max(...users.map(u => u.id)) + 1
  const user = Object.assign({}, body, { id })
  users.push(user)
  return Promise.resolve(user)
}

exports.updateUser = (id, updates) =>
  exports.findUserById(id).then(u => Object.assign(u, updates))
