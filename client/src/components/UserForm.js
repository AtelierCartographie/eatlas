// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import { fetchUser } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

type Props = {
  loading: boolean,
  user: User,
  // router
  match: {
    params: {
      id: string,
    },
  },
  // actions
  fetchUser: typeof fetchUser,
}

type State = {
  user?: User,
}

class UserForm extends Component<Props, State> {
  state = {}

  componentDidMount() {
    this.props.fetchUser(this.props.match.params.id)
  }

  componentWillReceiveProps({ user }) {
    if (user && !this.state.user) this.setState({ user })
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
    // TODO
    console.log(this.state.user)
  }

  render() {
    const { id } = this.props.match.params
    const { loading } = this.props
    const { user } = this.state
    const roles = ['admin', 'visitor']

    return (
      <div className="UserForm">
        <h1 className="title">User {id}</h1>
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
                  <select name="role" onChange={this.handleChange}>
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
                <button className="button is-primary">
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
    return {
      loading: users.loading,
      user: users.list.find(u => u.id === props.match.params.id),
    }
  },
  { fetchUser },
)(UserForm)
