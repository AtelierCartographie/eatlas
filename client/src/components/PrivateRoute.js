import React, { Component } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { connect } from 'react-redux'

const PrivateRoute = ({ component: Component, login, ...rest }) => (
  <Route {...rest} render={(props) => (
    login // when not logged in, login is null
      ? <Component {...props} />
      : <Redirect to={{
          pathname: '/login',
          state: { from: props.location }
        }} />
  )} />
)

export default connect(state => ({
  login: state.login
}))(PrivateRoute)
