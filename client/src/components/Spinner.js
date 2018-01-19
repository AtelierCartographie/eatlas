import React, { Component } from 'react'
import Icon from './Icon'

class Spinner extends Component<{}> {
  render() {
    // bulma does not offer the is-loading class on span :(
    return <Icon icon="spinner fa-pulse" />
  }
}

export default Spinner
