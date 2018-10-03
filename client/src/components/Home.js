// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'

class Home extends Component<{}> {
  render() {
    return (
      <div className="Home">
        <h1 className="title"><T id="bo.home" /></h1>
      </div>
    )
  }
}

export default Home
