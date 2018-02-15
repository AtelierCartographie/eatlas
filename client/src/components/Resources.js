// @flow

import './Resources.css'

import React, { Component } from 'react'
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
  locale: Locale,
  // url
  type: ResourceType | '',
  status: string,
  topic: string,
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

  if (resource.type === 'video') {
    // $FlowFixMe: not undefined
    const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
    return (
      <iframe
        className="preview"
        title={resource.title}
        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`}
        frameBorder="0"
        allowFullScreen
      />
    )
  }

  if (resource.type === 'sound' && resource.file) {
    const url = (process.env.REACT_APP_PUBLIC_PATH_sound || '/') + resource.file
    return <audio src={url} controls />
  }

  if (resource.type === 'definition' && resource.definitions) {
    return (
      <span>
        <T id="preview-lexicon" values={{ nb: resource.definitions.length }} />
      </span>
    )
  }

  return null
}

class Resources extends Component<Props, State> {
  state = { removeResource: null, removing: false, restoring: null }

  componentDidMount() {
    this.props.fetchResources()
    this.props.getTopics()
  }

  getMenuTo(params) {
    const { type, status, topic } = this.props
    const url = Object.assign({ type, status, topic }, params)
    const path = `/resources/${url.type}`
    let qs = '?'
    if (url.status) qs += `&status=${url.status}`
    if (url.topic) qs += `&topic=${url.topic}`
    return path + qs
  }

  renderTypeMenuItem(item: MenuItem) {
    const count = item.type
      ? this.props.resources.list.filter(r => r.type === item.type).length
      : this.props.resources.list.length

    const label = `type-${item.type || 'all'}`

    return (
      <li key={item.type}>
        <NavLink
          activeClassName="active"
          isActive={() => item.type === this.props.type}
          to={this.getMenuTo({ type: item.type })}>
          <Icon size="small" icon={item.icon} />
          <T id={label} /> {count !== 0 ? `(${count})` : ''}
        </NavLink>
      </li>
    )
  }

  renderTypeMenu(items: Array<MenuItem>) {
    return (
      <ul className="menu-list type-menu">
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
            isActive={() => !this.props.status}
            to={this.getMenuTo({ status: false })}>
            <span className="button is-small is-rounded" />
            <T id="type-all" />
          </NavLink>
        </li>
        {RESOURCE_STATUSES.map(s => (
          <li key={s}>
            <NavLink
              activeClassName="active"
              isActive={() => s === this.props.status}
              to={this.getMenuTo({ status: s })}>
              {this.renderStatusIcon(s)}
              <T id={`status-${s}`} />
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderTopicMenu() {
    return (
      <ul className="menu-list status-menu">
        <li key="all">
          <NavLink
            activeClassName="active"
            isActive={() => !this.props.topic}
            to={this.getMenuTo({ topic: false })}>
            <span className="button is-small is-rounded" />
            <T id="type-all" />
          </NavLink>
        </li>
        {this.props.topics.list.map(t => (
          <li key={t.id}>
            <NavLink
              activeClassName="active"
              isActive={() => t.id === this.props.topic}
              to={this.getMenuTo({ topic: t.id })}>
              <img alt="icon" src={`/topics/${t.id}.svg`} />
              {t.name}
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

  renderStatusCell(status) {
    return (
      <td className="cell-status">
        <NavLink
          activeClassName="active"
          isActive={() => status === this.props.status}
          to={this.getMenuTo({ status })}>
          {this.renderStatusIcon(status)}
        </NavLink>
      </td>
    )
  }

  renderTypeCell(type) {
    const item = typeItems.find(x => x.type === type)
    return (
      <td className="cell-type">
        <NavLink to={this.getMenuTo({ type })}>
          <Icon size="medium" icon={item.icon} />
        </NavLink>
      </td>
    )
  }

  renderRow = (resource: Resource) => {
    return (
      <tr key={resource.id}>
        <td>{resource.id}</td>
        {this.renderStatusCell(resource.status)}
        {this.renderTypeCell(resource.type)}
        {this.renderTopicCell(resource)}
        <td>{renderPreview(resource)}</td>
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

  renderList(resources: Array<Resource>, status, topic) {
    // Status then id asc
    const sorted = resources
      .filter(r => !status || r.status === status)
      .filter(r => !topic || r.topic === topic)
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
              <T id="resource-id" />
            </th>
            <th className="fit">
              <T id="resource-status" />
            </th>
            <th className="fit">
              <T id="resource-type" />
            </th>
            <th className="fit">
              <T id="resource-topic" />
            </th>
            <th>
              <T id="preview" />
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
            <th className="fit" />
          </tr>
        </thead>
        <tbody>{sorted.map(this.renderRow)}</tbody>
      </table>
    )
  }

  renderHeader() {
    const addButton = (
      <div className="level-right">
        <div className="level-item">
          <Link
            className="button is-primary"
            to={`/resources/new/${this.props.type}`}>
            <IconButton label="add" icon="plus" />
          </Link>
        </div>
      </div>
    )
    const title = (
      <div className="level-left">
        <div className="level-item">
          <h1 className="title">
            <NavLink to="/resources">
              <T id="resources" />
            </NavLink>
          </h1>
        </div>
      </div>
    )
    return (
      <div className="level">
        {title}
        {this.canAdd() && addButton}
      </div>
    )
  }

  canAdd() {
    // No 'add' button if we're in the "definition" type, and there is already a lexicon
    if (this.props.type === 'definition') {
      if (!this.props.resources.loaded || this.props.resources.loading) {
        return false
      }
      if (this.props.resources.list.some(r => r.type === 'definition')) {
        return false
      }
    }
    return true
  }

  renderTopicCell(resource: Resource) {
    if (!resource.topic) {
      return <td />
    }

    if (this.props.topics.loading) {
      return (
        <td>
          <Spinner small /> {resource.topic}
        </td>
      )
    }

    const topic = this.props.topics.list.find(t => t.id === resource.topic)

    if (!topic) {
      return (
        <td>
          <Icon icon="exclamation-triangle" /> {resource.topic}
        </td>
      )
    }

    return (
      <td>
        <NavLink
          activeClassName="active"
          isActive={() => topic.id === this.props.topic}
          to={this.getMenuTo({ topic: topic.id })}>
          <img alt="icon" src={`/topics/${topic.id}.svg`} />
        </NavLink>
      </td>
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

              <p className="menu-label">
                <T id="resource-topic" />
              </p>
              {this.renderTopicMenu()}
            </aside>
          </div>
          <div className="column is-10">
            {loading ? (
              <Spinner />
            ) : (
              this.renderList(
                filteredResources,
                this.props.status,
                this.props.topic,
              )
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
    ({ resources, topics, locale }: AppState, { match }: ContextRouter) => {
      const { searchParams } = new URL(window.document.location)
      return {
        locale,
        topics,
        resources,
        type: match.params.type || '',
        status: searchParams.get('status'),
        topic: searchParams.get('topic'),
      }
    },
    {
      getTopics,
      fetchResources,
    },
  )(injectIntl(Resources)),
)
