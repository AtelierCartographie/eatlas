import React, { Component } from 'react'

// onClick to prevent form submission
const noSubmit = e => e.preventDefault()

class Spinner extends Component<{}> {
  render() {
    // bulma does not offer the is-loading class on span :(
    return (
      <button className="button is-loading is-rounded" onClick={noSubmit} />
    )
  }
}

export default Spinner
