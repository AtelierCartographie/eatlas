// @flow

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import { connect } from 'react-redux'
import { fetchResources } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'

type Props = {
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  // actions
  fetchResources: typeof fetchResources,
}

type MenuItem = {
  label: string,
  icon: string,
  type: string,
}

const typeItems: Array<MenuItem> = [
  { label: 'all', icon: 'list', type: null },
  { label: 'maps', icon: 'map', type: 'map' },
  { label: 'photos', icon: 'camera-retro', type: 'image' },
  { label: 'videos', icon: 'film', type: 'video' },
  { label: 'sounds', icon: 'microphone', type: 'sound' },
]

class Resources extends Component<Props> {
  componentDidMount() {
    this.props.fetchResources()
  }

  renderTypeMenuItem(item: MenuItem) {
    const url = 'coucou'

    return (
      <li key={item.type}>
        <a href={url}>
          <Icon size="medium" icon={item.icon} />
          <T id={item.label} />
        </a>
      </li>
    )
  }

  renderTypeMenu(items: Array<MenuItem>) {
    return <ul className="menu-list">{items.map(this.renderTypeMenuItem)}</ul>
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
              {this.renderTypeMenu(typeItems)}
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
