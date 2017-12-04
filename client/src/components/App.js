import './App.css'

import { Link, Route, Switch } from 'react-router-dom'
import React, { Component } from 'react'

import Home from './Home'
import UserForm from './UserForm'
import Users from './Users'

class App extends Component {
  render() {
    return (
      <div className="App">
        <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
          <div className="navbar-menu">
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
    )
  }
}

export default App
