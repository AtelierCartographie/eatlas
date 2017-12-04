// @flow

import React, { Component } from 'react'
import GoogleLogin from 'react-google-login'
import { connect } from 'react-redux'

import { login } from '../api'
import { userLogin, notifyVerifyingUser } from './../actions'

type Props = {
  // actions
  userLogin: typeof userLogin,
  notifyVerifyingUser: typeof notifyVerifyingUser
}

type State = {
  error: ?string
}

class AuthButton extends Component<Props, State> {
  state = { error: null }

  render() {
    return (
      <div className="AuthButton">
        { this.renderError() }
        <GoogleLogin
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          buttonText="Log in with Google"
          onSuccess={({ tokenObj }) => this.login(tokenObj)}
          onFailure={({ error, details }) => this.fail(error, details)}
        />
      </div>
    )
  }

  renderError () {
    if (!this.state.error) {
      return null
    }

    return <strong>Authentication failed: {this.state.error}</strong>
  }

  login(token) {
    this.props.notifyVerifyingUser()
    login(token)
      .then(({ name, email, role }) => this.props.userLogin({ name, email, role }))
      .catch(err => {
        this.props.notifyVerifyingUser(false)
        this.fail('EATLAS_SERVER', err.message)
      })
  }

  fail(code, details) {
    this.setState({ error: `${details} (${code})` })
  }
}

export default connect(null, { userLogin, notifyVerifyingUser })(AuthButton)
