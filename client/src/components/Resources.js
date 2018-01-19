// @flow

import './Resources.css'

import React, { Component, Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'
import cx from 'classnames'

import { connect } from 'react-redux'
import { fetchResources, getTopics } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'
import Confirm from './Confirm'
import { deleteResource, updateResource } from '../api'

import type { ContextRouter } from 'react-router'

type Props = ContextIntl & {
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  topics: {
    loading: boolean,
    list: Array<Topic>,
  },
  type: ResourceType | '',
  // actions
  fetchResources: typeof fetchResources,
  getTopics: typeof getTopics,
}

type State = {
  removeResource: ?Resource,
  removing: boolean,
  restoring: ?Resource,
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
  state = { removeResource: null, removing: false, restoring: null }

  componentDidMount() {
    this.props.fetchResources()
    this.props.getTopics()
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
        <td className="cell-status">
          <span
            className={'status status-' + resource.status}
            title={this.props.intl.formatMessage({
              id: 'status-' + (resource.status || 'null'),
            })}
          />
        </td>
        <td>{resource.id}</td>
        <td>{resource.type}</td>
        <td>{this.renderPreview(resource)}</td>
        <td>{this.renderTopic(resource)}</td>
        <td>{resource.author}</td>
        <td>{resource.title}</td>
        <td>
          <div className="field is-grouped">
            <div className="control">
              <Link
                className="button is-primary"
                to={`/resources/${resource.id}/edit`}
                title={this.props.intl.formatMessage({ id: 'edit' })}>
                <IconButton icon="pencil" />
              </Link>
            </div>
            <div className="control">
              <button
                className={cx('button is-danger is-outlined', {
                  'is-loading':
                    this.state.removing &&
                    this.state.removeResource === resource,
                })}
                onClick={() =>
                  resource.status === 'deleted'
                    ? this.askHardRemove(resource)
                    : this.softRemove(resource)
                }
                title={this.props.intl.formatMessage({ id: 'delete' })}>
                <IconButton
                  icon={resource.status === 'deleted' ? 'times' : 'trash'}
                />
              </button>
            </div>
            {resource.status !== 'deleted' ? null : (
              <div className="control">
                <button
                  className={cx('button is-info is-outlined', {
                    'is-loading': this.state.restoring === resource,
                  })}
                  onClick={() => this.restore(resource)}
                  title={this.props.intl.formatMessage({ id: 'restore' })}>
                  <IconButton icon="history" />
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }

  askHardRemove(resource: ?Resource) {
    this.setState({ removeResource: resource })
  }

  async restore(resource: Resource) {
    if (resource.status !== 'deleted') {
      return
    }

    // TODO Redux
    this.setState({ restoring: resource })
    await updateResource(resource.id, { status: 'submitted' })
    this.setState({ restoring: null })
    this.props.fetchResources()
  }

  async softRemove(resource: Resource) {
    if (resource.status === 'deleted') {
      return
    }

    // TODO Redux
    this.setState({ removing: true })
    await updateResource(resource.id, { status: 'deleted' })
    this.setState({ removing: false, removeResource: null })
    this.props.fetchResources()
  }

  async hardRemove() {
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
              <T id="resource-status" />
            </th>
            <th>
              <T id="resource-id" />
            </th>
            <th>
              <T id="resource-type" />
            </th>
            <th>
              <T id="preview" />
            </th>
            <th>
              <T id="resource-topic" />
            </th>
            <th>
              <T id="resource-author" />
            </th>
            <th>
              <T id="resource-title" />
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

  renderTopic(resource: Resource) {
    if (!resource.topic) {
      return null
    }

    if (this.props.topics.loading) {
      return (
        <Fragment>
          <Spinner small /> {resource.topic}
        </Fragment>
      )
    }

    const topic = this.props.topics.list.find(t => t.id === resource.topic)

    if (!topic) {
      return (
        <Fragment>
          <Icon icon="exclamation-triangle" /> {resource.topic}
        </Fragment>
      )
    }

    return topic.name
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
          onClose={() => this.askHardRemove(null)}
          onConfirm={() => this.hardRemove()}
        />
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ resources, topics }: AppState, { match }: ContextRouter) => ({
      topics,
      resources,
      type: match.params.type || '',
    }),
    {
      getTopics,
      fetchResources,
    },
  )(injectIntl(Resources)),
)
