// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import { fetchUser, saveUser } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

type Props = {
  loading: boolean,
  user: User,
  userId: string, // From router
  // actions
  fetchUser: Function,
  saveUser: Function,
}

type State = {
  user?: User,
  updating: boolean,
}

const newUser: User = {
  name: '',
  email: '',
  role: 'visitor',
}

class UserForm extends Component<Props, State> {
  state = { updating: false }

  componentDidMount() {
    if (this.props.userId) {
      this.props.fetchUser(this.props.userId)
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
    // TODO when updating myself, changes should impact global UI (to be done in reducer)
    const { user, updating } = this.state
    if (updating) {
      return // already updating: cancel
    }

    this.props.saveUser(this.state.user).then(({ payload }) => {
      this.setState({ updating: false, user: payload.user })
    })
  }

  render() {
    const { loading, userId } = this.props
    const { updating, user } = this.state
    const roles = ['admin', 'visitor']

    return (
      <div className="UserForm">
        <h1 className="title">User {userId}</h1>
        {updating && <Spinner />}
        {loading || !user ? (
          <Spinner />
        ) : (
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label">
                <T id="name" />
              </label>
              <div className="control has-icons-left has-icons-right">
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
              <div className="control has-icons-left has-icons-right">
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
                    {roles.map(r => (
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
                <button className="button is-primary" disabled={updating}>
                  <IconButton label="submit" icon="check" />
                </button>
              </div>
              <div className="control">
                <Link className="button is-danger is-outlined" to="/users">
                  <T id="cancel" />
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default connect(
  ({ users }, props) => {
    const id = props.match.params.id
    if (id === 'new') {
      return { loading: false, user: null, userId: null }
    } else {
      return {
        loading: users.loading,
        user: users.list.find(u => u.id === id),
        userId: id,
      }
    }
  },
  { fetchUser, addUser },
)(UserForm)
