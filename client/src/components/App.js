import React, { Component } from 'react'
import { connect } from 'react-redux'

import './App.css'

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="hero">
          <div className="hero-body">
            <div className="container">eAtlas {this.props.hello}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(({ hello }) => ({
  hello,
}))(App)
