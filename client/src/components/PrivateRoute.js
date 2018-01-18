// @flow

import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import { connect } from 'react-redux'
import { FormattedMessage as T } from 'react-intl'
import Spinner from './Spinner'

const PrivateRoute = ({
  component: Component,
  checkedServerLogin,
  authenticated,
  ...rest
}) => {
  const render = authenticated
    ? loggedInRender(Component) // I had to inject Component or the generated code was fucked
    : checkedServerLogin // did we already ask to server if user was actually already known?
      ? loginFormRender // already, and he's still not logged in: display login form
      : waitCheckServerLogin // nope, let's do it

  return <Route {...rest} render={render} />
}

const loggedInRender = Component => props => <Component {...props} />

const loginFormRender = props => (
  <Redirect
    to={{
      pathname: '/login',
      state: { from: props.location },
    }}
  />
)

const waitCheckServerLogin = () => (
  <div>
    <Spinner />
    <T id="checking-credentials" />
  </div>
)

export default connect(({ user }: AppState) => ({
  checkedServerLogin: user.checkedServerLogin,
  authenticated: !!user.current,
}))(PrivateRoute)
