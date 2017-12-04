import React, { Component } from 'react'
import GoogleLogin from 'react-google-login'
import { connect } from 'react-redux'

class AuthButton extends Component {
  state = { error: null }

  render() {
    // TODO configuration
    return (
      <div className="AuthButton">
        { this.renderError() }
        <GoogleLogin
          clientId="348912836815-tk0l6mspavgeia4ufcbs3h2637rik6mr.apps.googleusercontent.com"
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
    // TODO API call
    // TODO redux-actions
    this.props.dispatch({ type: 'ui', payload: { verifying: true } })
    setTimeout(() => {
      this.props.dispatch({ type: 'ui', payload: { verifying: false } })
      this.props.dispatch({ type: 'login', payload: token })
    }, 1000)
  }

  fail(code, details) {
    this.setState({ error: `${details} (${code})` })
  }
}

export default connect()(AuthButton)
