// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'

import { connect } from 'react-redux'
import { fetchResources } from './../actions'
import Spinner from './Spinner'

type Props = {
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  // actions
  fetchResources: typeof fetchResources,
}

class Resources extends Component<Props> {
  componentDidMount() {
    this.props.fetchResources()
  }

  render() {
    const { loading } = this.props.resources
    return (
      <div className="Resources">
        <h1 className="title">
          <T id="resources" />
        </h1>
        {loading ? <Spinner /> : <div />}
      </div>
    )
  }
}

export default connect(({ resources }) => ({ resources }), { fetchResources })(
  Resources,
)
