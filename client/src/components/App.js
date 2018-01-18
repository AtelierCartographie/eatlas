// @flow

import './App.css'

import { NavLink as NavLinko, Route, Switch } from 'react-router-dom'
import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classNames from 'classnames'

import Home from './Home'
import IconButton from './IconButton'
import Login from './Login'
import PrivateRoute from './PrivateRoute'
import Resources from './Resources'
import Import from './Import'
import ResourceEdit from './ResourceEdit'
import Topics from './Topics'
import UserForm from './UserForm'
import Users from './Users'
import { userLogout } from '../actions'

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
        <PrivateRoute path="/import/:type?" component={Import} />
        <PrivateRoute path="/resources/:id/edit" component={ResourceEdit} />
        <PrivateRoute exact path="/" component={Home} />
        <PrivateRoute exact path="/users" component={Users} />
        <PrivateRoute path="/users/:id" component={UserForm} />
        <PrivateRoute exact path="/topics" component={Topics} />
      </Switch>
    )
  }

  render() {
    const { authenticated } = this.props
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
            {!authenticated ? (
              <div className="navbar-start">
                <NavLink to="/" label="home" exact />
              </div>
            ) : (
              <div className="navbar-start">
                <NavLink to="/" label="home" exact />
                <NavLink to="/topics" label="topics" />
                <NavLink to="/resources" label="resources" />
                <NavLink to="/users" label="users" />
                <NavLink to="/import" label="import" />
              </div>
            )}
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
