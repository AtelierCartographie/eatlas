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
      // $FlowFixMe: from is a correct location
      return <Redirect to={from} />
    }

    return (
      <div className="Auth">
        <h1 className="title">Log in</h1>
        <AuthButton />
      </div>
    )
  }
}

export default connect(({ user }: AppState) => ({
  authenticated: !!user.current,
}))(Login)
