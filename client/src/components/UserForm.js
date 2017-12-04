import React, { Component } from 'react'

class UserForm extends Component {
  render() {
    const { id } = this.props.match.params
    const user = {}

    return (
      <div className="UserForm">
        <h1 className="title">User {id}</h1>
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
              <button className="button is-danger is-outlined">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default UserForm
