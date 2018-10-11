// @flow

import './App.css'

import { NavLink as NavLinko, Route, Switch, Redirect } from 'react-router-dom'
import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import cx from 'classnames'
import { toast, ToastContainer } from 'react-toastify'

import IconButton from './IconButton'
import Login from './Login'
import PrivateRoute from './PrivateRoute'
import Resources from './Resources'
import ResourceCreate from './ResourceCreate'
import ResourceEdit from './ResourceEdit'
import TopicForm from './TopicForm'
import Topics from './Topics'
import UserForm from './UserForm'
import Users from './Users'
import { userLogout } from '../actions'
import gitVersion from '../git-version'
import { saveLocale } from '../user-lang'

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
    <T id={`bo.${label}` || 'bo.label'} />
  </NavLinko>
)

const LangButton = ({ lang }) => (
  <a
    className="navbar-item"
    href=""
    onClick={e => {
      e.preventDefault()
      saveLocale(lang)
      document.location.reload(true)
    }}>
    <T id={`common.flag-html.${lang}`} />
  </a>
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
        <Redirect exact from="/" to="/resources" />
        <Route exact path="/login" component={Login} />
        <PrivateRoute path="/resources/new/:type?" component={ResourceCreate} />
        <PrivateRoute path="/resources/:id/edit" component={ResourceEdit} />
        <PrivateRoute path="/resources/:type?" component={Resources} />
        <PrivateRoute exact path="/users" component={Users} />
        <PrivateRoute path="/users/:id" component={UserForm} />
        <PrivateRoute exact path="/topics" component={Topics} />
        <PrivateRoute path="/topics/:id" component={TopicForm} />
      </Switch>
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

  renderNav() {
    return (
      <nav className="navbar is-fixed-top is-dark" aria-label="main navigation">
        <div className="navbar-brand">
          <button
            className={cx('button', 'navbar-burger', {
              'is-active': this.state.menuActive,
            })}
            onClick={this.toggleActive}>
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          className={cx('navbar-menu', {
            'is-active': this.state.menuActive,
          })}
          onClick={this.toggleActive}>
          {!this.props.authenticated ? (
            <div className="navbar-start">
              <NavLink to="/" label="home" exact />
            </div>
          ) : (
            <div className="navbar-start">
              <NavLink to="/resources" label="resources" />
              <NavLink to="/topics" label="topics" />
              <NavLink to="/users" label="users" />
            </div>
          )}
          <div className="navbar-end">
            <LangButton lang="fr" />
            <LangButton lang="en" />
            <div className="navbar-item">version: {gitVersion}</div>
            {this.renderUserBox()}
          </div>
        </div>
      </nav>
    )
  }

  render() {
    return (
      <div className="App">
        <ToastContainer autoClose={2000} position={toast.POSITION.TOP_CENTER} />
        {this.renderNav()}
        <main className="section">
          <div className="container">{this.renderRoutes()}</div>
        </main>
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ user }: AppState) => ({
      authenticated: !!user.current,
      name: user.current && user.current.name,
      role: user.current && user.current.role,
    }),
    { userLogout },
  )(App),
)
