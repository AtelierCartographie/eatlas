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
        <div className="columns">
          <div className="column is-one-quarter">
            <aside className="menu">
              <p className="menu-label">Type</p>
              <ul className="menu-list">
                <li>
                  <a>
                    <span className="icon is-medium">
                      <i className="fa fa-map" />
                    </span>
                    <T id="maps" />
                  </a>
                </li>
                <li>
                  <a>
                    <span className="icon is-medium">
                      <i className="fa fa-camera-retro" />
                    </span>
                    <T id="photos" />
                  </a>
                </li>
                <li>
                  <a>
                    <span className="icon is-medium">
                      <i className="fa fa-film" />
                    </span>
                    <T id="videos" />
                  </a>
                </li>
                <li>
                  <a>
                    <span className="icon is-medium">
                      <i className="fa fa-microphone" />
                    </span>
                    <T id="sounds" />
                  </a>
                </li>
              </ul>
            </aside>
          </div>
          <div className="column">{loading ? <Spinner /> : <div />}</div>
        </div>
      </div>
    )
  }
}

export default connect(({ resources }) => ({ resources }), { fetchResources })(
  Resources,
)
