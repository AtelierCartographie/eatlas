import React, { Component } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { connect } from 'react-redux'

const PrivateRoute = ({ component: Component, checkedServerLogin, login, ...rest }) => {
  const render = login // when not logged in, login is null
    ? loggedInRender(Component) // I had to inject Component or the generated code was fucked
    : checkedServerLogin // did we already ask to server if user was actually already known?
      ? loginFormRender // already, and he's still not logged in: display login form
      : waitCheckServerLogin // nope, let's do it

  return <Route {...rest} render={render} />
}

const loggedInRender = Component => props => <Component { ...props } />

const loginFormRender = props => (
  <Redirect to={{
    pathname: '/login',
    state: { from: props.location }
  }} />
)

const waitCheckServerLogin = props => (
  <div>
    Checking your credentials…
  </div>
)

export default connect(state => ({
  checkedServerLogin: state.user.checkedServerLogin,
  login: state.user.login
}))(PrivateRoute)
