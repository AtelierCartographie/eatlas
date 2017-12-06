// @flow

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import { connect } from 'react-redux'
import { fetchResources } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'

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
    const { loading, list } = this.props.resources
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
          <div className="column">
            {loading ? (
              <Spinner />
            ) : (
              <table className="table is-striped is-bordered is-fullwidth">
                <thead>
                  <tr>
                    <th>
                      <T id="name" />
                    </th>
                    <th>type</th>
                    <th style={{ width: '1px' }} />
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.type}</td>
                      <td>
                        <div className="field is-grouped">
                          <div className="control">
                            <Link
                              className="button is-primary"
                              to={`/resources/${r.id}/edit`}>
                              <IconButton label="edit" icon="pencil" />
                            </Link>
                          </div>
                          <div className="control">
                            <button className="button is-danger is-outlined">
                              <IconButton label="delete" icon="times" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default connect(({ resources }) => ({ resources }), { fetchResources })(
  Resources,
)
