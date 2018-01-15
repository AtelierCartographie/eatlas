// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'

type Props = {
  type: ResourceType,
}

type State = {}

class ResourceForm extends Component<Props, State> {
  state = {}

  render() {
    const { type } = this.props

    return (
      <div className="ResourceForm">
        <h1>
          <T id="resource-create" values={{ type }} />
        </h1>
        {this.renderForm(type)}
      </div>
    )
  }

  renderForm(type) {
    return <p>TODO: form depending on type: {type}</p>
  }
}

export default withRouter(
  connect(({ resources }, { match }) => {
    const type = match.params.type

    return { type }
  })(ResourceForm),
)
