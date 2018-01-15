// @flow

import './App.css'

import { NavLink as NavLinko, Route, Switch } from 'react-router-dom'
import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'

import Home from './Home'
import IconButton from './IconButton'
import Login from './Login'
import PrivateRoute from './PrivateRoute'
import Resources from './Resources'
import ResourceForm from './ResourceForm'
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

  renderRoutes() {
    return (
      <Switch>
        <Route exact path="/login" component={Login} />
        <PrivateRoute exact path="/resources/:type?" component={Resources} />
        <PrivateRoute path="/resources/:type/new" component={ResourceForm} />
        <PrivateRoute path="/resources/:id/edit" component={ResourceForm} />
        <PrivateRoute exact path="/" component={Home} />
        <PrivateRoute exact path="/users" component={Users} />
        <PrivateRoute path="/users/:id" component={UserForm} />
        <PrivateRoute path="/upload" component={Upload} />
      </Switch>
    )
  }

  render() {
    return (
      <div className="App">
        <nav
          className="navbar is-fixed-top is-dark"
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
              <NavLink to="/upload" label="import" />
            </div>
            <div className="navbar-end">{this.renderUserBox()}</div>
          </div>
        </nav>
        <main className="section">
          <div className="container">{this.renderRoutes()}</div>
        </main>
      </div>
    )
  }

  renderUserBox() {
    const { authenticated, name, role } = this.props
    if (!authenticated) {
      return (
        <NavLinko
          activeClassName="is-active"
          className="navbar-item"
          exact
          to="/login">
          <IconButton label="connection" icon="sign-in" />
        </NavLinko>
      )
    }

    // TODO proper user box with link to profile 'n co
    return (
      <Fragment>
        <div className="navbar-item">
          {name} ({role})
        </div>
        <a className="navbar-item" onClick={this.props.userLogout}>
          <IconButton label="disconnection" icon="sign-out" />
        </a>
      </Fragment>
    )
  }
}

export default withRouter(
  connect(
    ({ user }) => ({
      authenticated: !!user.id,
      name: user.name,
      role: user.role,
    }),
    { userLogout },
  )(App),
)
