// @flow

import './Resources.css'

import React, { Component, Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'

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
  type: ResourceType,
  // actions
  fetchResources: typeof fetchResources,
}

type MenuItem = {
  label: string,
  icon: string,
  type: ResourceType,
}

const typeItems: Array<MenuItem> = [
  { label: 'all', icon: 'list', type: '' },
  { label: 'articles', icon: 'file-text', type: 'article' },
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
    return (
      <li key={item.type}>
        <NavLink activeClassName="active" exact to={'/resources/' + item.type}>
          <Icon size="medium" icon={item.icon} />
          <T id={item.label} />
        </NavLink>
      </li>
    )
  }

  renderTypeMenu(items: Array<MenuItem>) {
    return (
      <ul className="menu-list">
        {items.map(i => this.renderTypeMenuItem(i))}
      </ul>
    )
  }

  renderRow(resource: Resource) {
    return (
      <tr key={resource.id}>
        <td>{resource.name}</td>
        <td>{resource.type}</td>
        <td>
          <div className="field is-grouped">
            <div className="control">
              <Link
                className="button is-primary"
                to={`/resources/${resource.id}/edit`}>
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
    )
  }

  renderList(resources: Array<Resource>) {
    return (
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
        <tbody>{resources.map(this.renderRow)}</tbody>
      </table>
    )
  }

  renderCreate(type: ResourceType) {
    if (!type) {
      return null
    }

    return (
      <Link
        className="button is-primary"
        to={`/resources/${this.props.type}/new`}>
        <IconButton label="add" icon="plus" />
      </Link>
    )
  }

  renderResources(resources: Array<Resource>, type: ResourceType) {
    return (
      <Fragment>
        {this.renderCreate(type)}
        {this.renderList(resources)}
      </Fragment>
    )
  }

  render() {
    const { loading, list } = this.props.resources
    const filteredResources = this.props.type
      ? list.filter(r => r.type === this.props.type)
      : list

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
              this.renderResources(filteredResources, this.props.type)
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ resources }, { match }) => ({
      resources,
      type: match.params.type || '',
    }),
    {
      fetchResources,
    },
  )(Resources),
)
