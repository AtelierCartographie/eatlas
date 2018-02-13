// @flow

import './Resources.css'

import React, { Component, Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'
import cx from 'classnames'
import timeago from 'timeago.js'

import { connect } from 'react-redux'
import { fetchResources, getTopics } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'
import Confirm from './Confirm'
import { deleteResource, updateResource } from '../api'
import { STATUS_STYLE, RESOURCE_STATUSES } from '../constants'

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
  locale: Locale,
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
  { icon: 'list', type: '' },
  { icon: 'file-text', type: 'article' },
  { icon: 'bullseye', type: 'focus' },
  { icon: 'book', type: 'definition' },
  { icon: 'map', type: 'map' },
  { icon: 'camera-retro', type: 'image' },
  { icon: 'film', type: 'video' },
  { icon: 'microphone', type: 'sound' },
]

export const renderPreview = (resource: Resource) => {
  if (resource.type === 'article') {
    return <span>{resource.title}</span>
  }

  if (resource.type === 'image' && resource.images) {
    // medium@1x is mandatory, we can count on it
    const file = resource.images.medium['1x']
    if (file) {
      const url = (process.env.REACT_APP_PUBLIC_PATH_image || '/') + file
      return <img className="preview" src={url} alt={file} />
    }
  }

  if (resource.type === 'map' && resource.file) {
    const url = (process.env.REACT_APP_PUBLIC_PATH_map || '/') + resource.file
    return <img className="preview" src={url} alt={resource.file} />
  }

  return null
}

class Resources extends Component<Props, State> {
  state = { removeResource: null, removing: false, restoring: null }

  componentDidMount() {
    this.props.fetchResources()
    this.props.getTopics()
  }

  renderTypeMenuItem(item: MenuItem) {
    const count = item.type
      ? this.props.resources.list.filter(r => r.type === item.type).length
      : this.props.resources.list.length

    const label = `type-${item.type || 'all'}`

    return (
      <li key={item.type}>
        <NavLink activeClassName="active" exact to={'/resources/' + item.type}>
          <Icon size="medium" icon={item.icon} />
          <T id={label} /> {count !== 0 ? `(${count})` : ''}
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

  renderStatusMenu() {
    return (
      <ul className="menu-list status-menu">
        <li key="all">
          <NavLink
            activeClassName="active"
            isActive={() => '' === this.props.status}
            to={`/resources/${this.props.type}`}>
            <span className="button is-small is-rounded" />
            <T id="type-all" />
          </NavLink>
        </li>
        {RESOURCE_STATUSES.map(s => (
          <li key={s}>
            <NavLink
              activeClassName="active"
              isActive={() => s === this.props.status}
              to={`/resources/${this.props.type}?${s}`}>
              {this.renderStatusIcon(s)}
              <T id={`status-${s}`} />
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderStatusIcon(status) {
    return (
      <span
        className={cx(
          'button is-small is-rounded',
          'is-' + STATUS_STYLE[status],
        )}
        title={this.props.intl.formatMessage({
          id: 'status-' + (status || 'null'),
        })}
      />
    )
  }

  renderRow = (resource: Resource) => {
    return (
      <tr key={resource.id}>
        <td className="cell-status">
          {this.renderStatusIcon(resource.status)}
        </td>
        <td>{resource.id}</td>
        <td>{resource.type}</td>
        <td>{renderPreview(resource)}</td>
        <td>{this.renderTopic(resource)}</td>
        <td>{resource.author}</td>
        <td>{resource.title}</td>
        <td>{timeago().format(resource.createdAt, this.props.locale)}</td>
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

  static STATUS_ORDER = ['published', 'validated', 'submitted', 'deleted']
  static statusOrder = (status: ?ResourceStatus): number =>
    status ? Resources.STATUS_ORDER.indexOf(status) : -1

  renderList(resources: Array<Resource>, status) {
    // Status then id asc
    const sorted = resources
      .filter(r => !status || r.status === status)
      .sort((r1, r2) => {
        if (r1.status === r2.status) {
          return r1.id > r2.id ? +1 : -1
        } else {
          return (
            Resources.statusOrder(r1.status) - Resources.statusOrder(r2.status)
          )
        }
      })

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
            <th>
              <T id="resource-created-at" />
            </th>
            <th style={{ width: '1px' }} />
          </tr>
        </thead>
        <tbody>{sorted.map(this.renderRow)}</tbody>
      </table>
    )
  }

  renderHeader() {
    return (
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <h1 className="title">
              <T id="resources" />
            </h1>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <Link
              className="button is-primary"
              to={`/resources/new/${this.props.type}`}>
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
          <div className="column is-2">
            <aside className="menu">
              <p className="menu-label">
                <T id="resource-type" />
              </p>
              {this.renderTypeMenu(typeItems)}
              <p className="menu-label">
                <T id="resource-status" />
              </p>
              {this.renderStatusMenu()}
            </aside>
          </div>
          <div className="column is-10">
            {loading ? (
              <Spinner />
            ) : (
              this.renderList(filteredResources, this.props.status)
            )}
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
    ({ resources, topics, locale }: AppState, { match }: ContextRouter) => ({
      locale,
      topics,
      resources,
      type: match.params.type || '',
      status: document.location.search.slice(1),
    }),
    {
      getTopics,
      fetchResources,
    },
  )(injectIntl(Resources)),
)
