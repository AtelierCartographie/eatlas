import './App.css';

import { Link, Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';

import Home from './Home';
import UserForm from './UserForm';
import Users from './Users';
import classNames from 'classnames';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menuActive: false,
    };

    this.toggleActive = this.toggleActive.bind(this);
  }

  toggleActive() {
    this.setState({
      menuActive: !this.state.menuActive
    });
  }

  render() {
    return (
      <div className="App">
        <nav
          className="navbar is-fixed-top is-primary"
          role="navigation"
          aria-label="main navigation"
        >
          <div className="navbar-brand">
            <button className={classNames({'button': true, 'navbar-burger': true, 'is-active': this.state.menuActive})} onClick={this.toggleActive}>
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className={classNames({'navbar-menu': true, 'is-active': this.state.menuActive })} onClick={this.toggleActive}>
            <Link className="navbar-item" to="/">
              Home
            </Link>
            <Link className="navbar-item" to="/users">
              Users
            </Link>
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
