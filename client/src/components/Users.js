// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'

import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { fetchUsers } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

type Props = {
  users: {
    loading: boolean,
    list: Array<User>,
  },
  // actions
  fetchUsers: typeof fetchUsers,
}

class Users extends Component<Props> {
  componentDidMount() {
    this.props.fetchUsers()
  }

  render() {
    const { list, loading } = this.props.users
    return (
      <div className="Users">
        <h1 className="title">
          <T id="users" />
          <Link className="button is-primary" to={`/users/new`}>
            <IconButton label="add" icon="plus" />
          </Link>
        </h1>
        {loading ? (
          <Spinner />
        ) : (
          <table className="table is-striped is-bordered is-fullwidth">
            <thead>
              <tr>
                <th>
                  <T id="name" />
                </th>
                <th>email</th>
                <th>role</th>
                <th style={{ width: '1px' }} />
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.email}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <div className="field is-grouped">
                      <div className="control">
                        <Link
                          className="button is-primary"
                          to={`/users/${u.id}/edit`}>
                          <IconButton label="edit" icon="pencil" />
                        </Link>
                      </div>
                      <div className="control">
                        <button className="button is-danger is-outlined">
                          <IconButton label="delete" icon="times" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}

export default connect(({ users }) => ({ users }), { fetchUsers })(Users)
