import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link, Switch, Route } from 'react-router-dom'

import './App.css'
import Home from './Home'
import Users from './Users'

class App extends Component {
  render() {
    return (
      <div className="App">
        <nav className="navbar" role="navigation" aria-label="main navigation">
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
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/users" component={Users} />
          </Switch>
        </main>
      </div>
    )
  }
}

export default connect()(App)
