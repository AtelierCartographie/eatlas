import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { fetchUser } from './../actions'

class UserForm extends Component {
  componentDidMount() {
    this.props.fetchUser(this.props.match.params.id)
  }

  render() {
    const { id } = this.props.match.params
    const { user, loading } = this.props

    return (
      <div className="UserForm">
        <h1 className="title">User {id}</h1>
        {loading || !user ? (
          <span>loading…</span>
        ) : (
          <form>
            <div className="field">
              <label className="label">Name</label>
              <div className="control has-icons-left has-icons-right">
                <input
                  className="input"
                  type="text"
                  placeholder="name"
                  value={user.name}
                />
                <span className="icon is-small is-left">
                  <i className="fa fa-user" />
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="control has-icons-left has-icons-right">
                <input
                  className="input"
                  type="email"
                  placeholder="email"
                  value={user.email}
                />
                <span className="icon is-small is-left">
                  <i className="fa fa-envelope" />
                </span>
              </div>
            </div>

            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary">Submit</button>
              </div>
              <div className="control">
                <Link className="button is-danger is-outlined" to="/users">Cancel</Link>
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
