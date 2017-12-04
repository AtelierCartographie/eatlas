// @flow

import React, { Component } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import AuthButton from './AuthButton'

type Props = {
  authenticated: boolean,
  // router
  location: {
    state: {
      from: { pathname: string },
    },
  },
}

class Login extends Component<Props> {
  render() {
    if (this.props.authenticated) {
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
  authenticated: !!state.user.email,
}))(Login)
