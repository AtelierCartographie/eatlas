import React, { Component } from 'react'

class Spinner extends Component<{}> {
  render() {
    // bulma does not offer the is-loading class on span :(
    return <button className="button is-loading is-rounded" />
  }
}

export default Spinner
