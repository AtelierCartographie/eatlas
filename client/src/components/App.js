import './App.css';

import { NavLink, Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';

import Home from './Home';
import UserForm from './UserForm';
import Users from './Users';
import classNames from 'classnames';

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
            </div>
          </div>
        </nav>
        <main>
          <div className="container">
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/users" component={Users} />
              <Route path="/users/:id" component={UserForm} />
            </Switch>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
