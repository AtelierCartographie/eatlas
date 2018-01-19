import React, { Component } from 'react'
import Icon from './Icon'

class Spinner extends Component<{ small: boolean }> {
  render() {
    return (
      <Icon icon={`spinner fa-pulse${this.props.small ? '' : ' is-size-2'}`} />
    )
  }
}

export default Spinner
