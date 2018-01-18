// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { getUsers, deleteUser } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'
import Confirm from './Confirm'

type Props = {
  users: {
    loading: boolean,
    list: Array<User>,
  },
  // actions
  getUsers: typeof getUsers,
  deleteUser: typeof deleteUser,
}

type State = {
  removeModel: ?User,
  removing: boolean,
}

class Users extends Component<Props, State> {
  state = { removeModel: null, removing: false }

  componentDidMount() {
    this.props.getUsers()
  }

  askRemove(model: ?User) {
    this.setState({ removeModel: model })
  }

  deleteUser() {
    const { removeModel } = this.state
    if (!removeModel) return

    this.setState({ removing: true })
    this.props.deleteUser(removeModel.id).then(() => {
      this.setState({ removing: false, removeModel: null })
      this.props.getUsers()
    })
  }

  render() {
    const { list, loading } = this.props.users
    return (
      <div className="Users">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">
                <T id="users" />
              </h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <Link className="button is-primary" to={`/users/new`}>
                <IconButton label="add" icon="plus" />
              </Link>
            </div>
          </div>
        </div>
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
                        <button
                          className="button is-danger is-outlined"
                          onClick={() => this.askRemove(u)}>
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
        <Confirm
          model={this.state.removeModel}
          removing={this.state.removing}
          onClose={() => this.askRemove(null)}
          onConfirm={() => this.deleteUser()}
        />
      </div>
    )
  }
}

export default connect(({ users }: AppState) => ({ users }), {
  getUsers,
  deleteUser,
})(Users)
