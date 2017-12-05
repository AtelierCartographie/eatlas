// @flow

import './App.css'

import { NavLink, Route, Switch } from 'react-router-dom'
import React, { Component } from 'react'
import classNames from 'classnames'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import Home from './Home'
import Upload from './Upload'
import UserForm from './UserForm'
import Users from './Users'
import PrivateRoute from './PrivateRoute'
import Login from './Login'
import { userLogout } from '../actions'

type Props = {
  authenticated: boolean,
  name: string,
  role: string,
  // actions
  userLogout: typeof userLogout,
}

type State = {
  menuActive: boolean,
}

class App extends Component<Props, State> {
  state = {
    menuActive: false,
  }

  toggleActive = () => {
    this.setState({
      menuActive: !this.state.menuActive,
    })
  }

  render() {
    return (
      <div className="App">
        <nav
          className="navbar is-fixed-top is-primary"
          aria-label="main navigation">
          <div className="navbar-brand">
            <button
              className={classNames('button', 'navbar-burger', {
                'is-active': this.state.menuActive,
              })}
              onClick={this.toggleActive}>
              <span />
              <span />
              <span />
            </button>
          </div>

          <div
            className={classNames('navbar-menu', {
              'is-active': this.state.menuActive,
            })}
            onClick={this.toggleActive}>
            <div className="navbar-start">
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                exact
                to="/">
                Home
              </NavLink>
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                to="/users">
                Users
              </NavLink>
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                to="/upload">
                Upload
              </NavLink>{' '}
            </div>
            <div className="navbar-end">{this.renderUserBox()}</div>
          </div>
        </nav>
        <main>
          <div className="container">
            <Switch>
              <Route exact path="/login" component={Login} />
              <PrivateRoute exact path="/" component={Home} />
              <PrivateRoute exact path="/users" component={Users} />
              <PrivateRoute path="/users/:id" component={UserForm} />
              <PrivateRoute path="/upload" component={Upload} />
            </Switch>
          </div>
        </main>
      </div>
    )
  }

  renderUserBox() {
    const { authenticated, name, role } = this.props
    if (!authenticated) {
      return (
        <NavLink
          className="navbar-item"
          activeClassName="is-active"
          exact
          to="/login">
          Log In
        </NavLink>
      )
    }

    // TODO proper user box with link to profile 'n co
    return (
      <a className="navbar-item" onClick={this.props.userLogout}>
        <strong title={`Role: ${role} (click to log out)`}>{name}</strong>
      </a>
    )
  }
}

export default withRouter(
  connect(
    state => ({
      authenticated: !!state.user.email,
      name: state.user.name,
      role: state.user.role,
    }),
    { userLogout },
  )(App),
)
