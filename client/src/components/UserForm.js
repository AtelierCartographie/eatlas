// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { toast } from 'react-toastify'

import { getUser, saveUser } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'
import { ROLES } from '../constants'

import type { ContextRouter } from 'react-router'

type Props = {
  loading: boolean,
  loggedUserId: string,
  saving: boolean,
  user: UserNew | User,
  userId: string, // From router
  // actions
  getUser: typeof getUser,
  saveUser: typeof saveUser,
  // router
  redirect: Function,
}

type State = {
  user?: UserNew | User,
}

const newUser: UserNew = {
  name: '',
  email: '',
  role: 'visitor',
}

class UserForm extends Component<Props, State> {
  state = {}

  componentDidMount() {
    if (this.props.userId) {
      this.props.getUser(this.props.userId)
    } else {
      this.setState(() => ({ user: newUser }))
    }
  }

  componentWillReceiveProps({ user }) {
    if (user && !this.state.user) {
      this.setState({ user })
    }
  }

  handleChange = ({ target }) => {
    const { name, value } = target
    this.setState(state => ({
      user: {
        ...state.user,
        [name]: value,
      },
    }))
  }

  handleSubmit = evt => {
    evt.preventDefault()
    if (this.props.saving) {
      return // already saving: cancel
    }

    this.props.saveUser(this.state.user).then(() => {
      toast.success(<T id="bo.toast-user-saved" />)
      this.props.redirect('/users')
    })
  }

  render() {
    const { loading, saving, userId, loggedUserId } = this.props
    const { user } = this.state

    return (
      <div className="UserForm">
        <h1 className="title">
          User {user ? user.name : ''}
          {loggedUserId === userId && (
            <span>
              {' ('}
              <T id="bo.myself" />
              {')'}
            </span>
          )}
        </h1>
        {saving && <Spinner />}
        {loading || !user ? (
          <Spinner />
        ) : (
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label">
                <T id="bo.name" />
              </label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  name="name"
                  type="text"
                  placeholder="name"
                  value={user.name}
                  onChange={this.handleChange}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fa fa-user" />
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label">email</label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder="email"
                  value={user.email}
                  onChange={this.handleChange}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fa fa-envelope" />
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label">role</label>
              <div className="control">
                <div className="select">
                  <select
                    name="role"
                    onChange={this.handleChange}
                    value={user.role}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary" disabled={saving}>
                  <IconButton label="validate" icon="check" />
                </button>
              </div>
              <div className="control">
                <Link className="button is-danger is-outlined" to="/users">
                  <T id="bo.cancel" />
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ users, user }: AppState, { match, history }: ContextRouter) => {
      const { id } = match.params
      const redirect = history.push.bind(history)
      return {
        loading: users.loading,
        saving: users.saving,
        user: users.list.find(u => u.id === id) || null,
        userId: id === 'new' ? null : id,
        redirect,
        loggedUserId: user.current && user.current.id,
      }
    },
    { getUser, saveUser },
  )(UserForm),
)
