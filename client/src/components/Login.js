import React, { Component } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import AuthButton from './AuthButton'

class Login extends Component {
  render() {
    if (this.props.login) {
      // Already authenticated: redirect to referer
      const { from } = this.props.location.state || { from: { pathname: '/' } }
      return <Redirect to={from} />
    }

    return (
      <div className="Auth">
        <h1>Log in</h1>
        <AuthButton />
      </div>
    )
  }
}

export default connect(state => ({
  login: state.user.login,
}))(Login)
