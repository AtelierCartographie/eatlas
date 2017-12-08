// @flow

import './App.css'

import { NavLink as NavLinko, Route, Switch } from 'react-router-dom'
import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'

import Home from './Home'
import Login from './Login'
import PrivateRoute from './PrivateRoute'
import Resources from './Resources'
import Upload from './Upload'
import UserForm from './UserForm'
import Users from './Users'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { userLogout } from '../actions'
import { withRouter } from 'react-router'

const NavLink = ({
  to,
  label,
  exact,
}: {
  to: string,
  label: string,
  exact?: boolean,
}) => (
  <NavLinko
    activeClassName="is-active"
    className="navbar-item"
    exact={exact}
    to={to}>
    <T id={label || 'label'} />
  </NavLinko>
)

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
              <NavLink to="/" label="home" exact />
              <NavLink to="/resources" label="resources" />
              <NavLink to="/users" label="users" />
              <NavLink to="/upload" label="upload" />
            </div>
            <div className="navbar-end">{this.renderUserBox()}</div>
          </div>
        </nav>
        <main className="section">
          <div className="container">
            <Switch>
              <Route exact path="/login" component={Login} />
              <Route exact path="/resources" component={Resources} />
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
      return <NavLink to="/login" label="connection" exact />
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
