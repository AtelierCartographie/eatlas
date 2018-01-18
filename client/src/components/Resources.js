// @flow

import './Resources.css'

import React, { Component } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'

import { connect } from 'react-redux'
import { fetchResources } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'
import Confirm from './Confirm'
import { deleteResource } from '../api'

type Props = {
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  type: ResourceType | '',
  // actions
  fetchResources: typeof fetchResources,
}

type State = {
  removeResource: ?Resource,
  removing: boolean,
}

type MenuItem = {
  label: string,
  icon: string,
  type: ResourceType | '',
}

const typeItems: Array<MenuItem> = [
  { label: 'all', icon: 'list', type: '' },
  { label: 'articles', icon: 'file-text', type: 'article' },
  { label: 'focus', icon: 'bullseye', type: 'focus' },
  { label: 'definitions', icon: 'book', type: 'definition' },
  { label: 'maps', icon: 'map', type: 'map' },
  { label: 'photos', icon: 'camera-retro', type: 'image' },
  { label: 'videos', icon: 'film', type: 'video' },
  { label: 'sounds', icon: 'microphone', type: 'sound' },
]

class Resources extends Component<Props, State> {
  state = { removeResource: null, removing: false }

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

  renderPreview(resource: Resource) {
    if (resource.type === 'article') {
      return <span>{resource.title}</span>
    }

    if (resource.type === 'image' && resource.images) {
      // medium@1x is mandatory, we can count on it
      const file = resource.images.medium['1x']
      const url = (process.env.REACT_APP_PUBLIC_PATH_image || '/') + file
      return <img className="preview" src={url} alt={file} />
    }

    if (resource.type === 'map' && resource.file) {
      const url = (process.env.REACT_APP_PUBLIC_PATH_map || '/') + resource.file
      return <img className="preview" src={url} alt={resource.file} />
    }

    return null
  }

  renderRow = (resource: Resource) => {
    return (
      <tr key={resource.id}>
        <td>{resource.id}</td>
        <td>{resource.type}</td>
        <td>{this.renderPreview(resource)}</td>
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
              <button
                className="button is-danger is-outlined"
                onClick={() => this.askRemove(resource)}>
                <IconButton label="delete" icon="times" />
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  askRemove(resource: ?Resource) {
    this.setState({ removeResource: resource })
  }

  async doRemove() {
    const resource = this.state.removeResource
    if (!resource) return

    // TODO Redux
    this.setState({ removing: true })
    await deleteResource(resource.id)
    this.setState({ removing: false, removeResource: null })
    this.props.fetchResources()
  }

  renderList(resources: Array<Resource>) {
    return (
      <table className="table is-striped is-bordered is-fullwidth">
        <thead>
          <tr>
            <th>
              <T id="resource-id" />
            </th>
            <th>
              <T id="resource-type" />
            </th>
            <th>
              <T id="preview" />
            </th>
            <th style={{ width: '1px' }} />
          </tr>
        </thead>
        <tbody>{resources.map(this.renderRow)}</tbody>
      </table>
    )
  }

  renderHeader(includeAdd = false) {
    const title = (
      <h1 className="title">
        <T id="resources" />
      </h1>
    )

    if (!includeAdd) {
      return title
    }

    return (
      <div className="level">
        <div className="level-left">
          <div className="level-item">{title}</div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <Link
              className="button is-primary"
              to={`/import/${this.props.type}`}>
              <IconButton label="add" icon="plus" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { loading, list } = this.props.resources
    const filteredResources = this.props.type
      ? list.filter(r => r.type === this.props.type)
      : list

    return (
      <div className="Resources">
        {this.renderHeader()}
        <div className="columns">
          <div className="column is-one-quarter">
            <aside className="menu">
              <p className="menu-label">Type</p>
              {this.renderTypeMenu(typeItems)}
            </aside>
          </div>
          <div className="column">
            {loading ? <Spinner /> : this.renderList(filteredResources)}
          </div>
        </div>
        <Confirm
          model={
            this.state.removeResource
              ? { name: this.state.removeResource.id }
              : null
          }
          removing={this.state.removing}
          onClose={() => this.askRemove(null)}
          onConfirm={() => this.doRemove()}
        />
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
