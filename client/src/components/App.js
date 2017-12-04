import './App.css';

import { NavLink, Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';
import classNames from 'classnames';

import Home from './Home';
import Upload from './Upload';
import UserForm from './UserForm';
import Users from './Users';
import PrivateRoute from './PrivateRoute'
import Login from './Login'


class App extends Component {
  state = {
    menuActive: false
  };

  toggleActive = () => {
    this.setState({
      menuActive: !this.state.menuActive
    });
  };

  render() {
    return (
      <div className="App">
        <nav
          className="navbar is-fixed-top is-primary"
          role="navigation"
          aria-label="main navigation"
        >
          <div className="navbar-brand">
            <button
              className={classNames('button', 'navbar-burger', {
                'is-active': this.state.menuActive
              })}
              onClick={this.toggleActive}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div
            className={classNames('navbar-menu', {
              'is-active': this.state.menuActive
            })}
            onClick={this.toggleActive}
          >
            <div className="navbar-start">
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                exact
                to="/"
              >
                Home
              </NavLink>
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                to="/users"
              >
                Users
              </NavLink>
              <NavLink
                activeClassName="is-active"
                className="navbar-item"
                to="/upload"
              >
                Upload
              </NavLink>{' '}
            </div>
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
    );
  }
}

export default withRouter(connect()(App))
