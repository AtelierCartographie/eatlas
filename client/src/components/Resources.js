// @flow

import './Resources.css'

import React, { Component } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import cx from 'classnames'

import { connect } from 'react-redux'
import { fetchResources } from './../actions'
import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'
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

  renderRow = (resource: Resource) => {
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

  renderRemoveModal() {
    const resource = this.state.removeResource

    return (
      <div className={cx('modal', { 'is-active': !!resource })}>
        <div className="modal-background" />
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              <T id="delete" /> {resource ? resource.name : ''}
            </p>
            <button
              className="delete"
              aria-label="close"
              onClick={() => this.askRemove(null)}
            />
          </header>
          <section className="modal-card-body">
            <T id="confirm-delete" values={resource || {}} />
          </section>
          <footer className="modal-card-foot">
            <button
              className="button is-success"
              onClick={() => this.doRemove()}>
              <T id="delete" />
            </button>
            <button
              className={cx('button', { 'is-loading': this.state.removing })}
              onClick={() => this.askRemove(null)}>
              <T id="cancel" />
            </button>
          </footer>
        </div>
      </div>
    )
  }

  async doRemove() {
    const resource = this.state.removeResource
    if (!resource) {
      return
    }

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

  render() {
    const { loading, list } = this.props.resources
    const filteredResources = this.props.type
      ? list.filter(r => r.type === this.props.type)
      : list

    return (
      <div className="Resources">
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
                to={`/import/${this.props.type}`}>
                <IconButton label="add" icon="plus" />
              </Link>
            </div>
          </div>
        </div>
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
        {this.renderRemoveModal()}
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
