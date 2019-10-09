// @flow

import './Topics.css'

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import cx from 'classnames'
import { NavLink, withRouter } from 'react-router-dom'

import { getTopics, deleteTopic, fetchResources } from './../actions'
import IconButton from './IconButton'
import Icon from './Icon'
import Spinner from './Spinner'
import Confirm from './Confirm'
import { RESOURCE_TYPES, TYPE_ICON, LOCALES } from '../constants'
import Flag from './Flag'
import { updateLocation } from '../utils'

import type { ContextRouter } from 'react-router'

const SHOWN_TYPES = RESOURCE_TYPES.filter(type => type !== 'definition')

type Props = {
  topics: {
    loading: boolean,
    list: Array<Topic>,
  },
  // used to display the articles count column
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  // actions
  getTopics: typeof getTopics,
  deleteTopic: typeof deleteTopic,
  fetchResources: typeof fetchResources,
}

type State = {
  removeModel: ?Topic,
  removing: boolean,
}

type FiltersProps = {
  language: Locale | '',
}

class Topics extends Component<Props, State> {
  state = { removeModel: null, removing: false }

  componentDidMount() {
    this.props.getTopics()
    this.props.fetchResources()
  }

  askRemove(model: ?Topic) {
    this.setState({ removeModel: model })
  }

  deleteModel() {
    const { removeModel } = this.state
    if (!removeModel) return

    this.setState({ removing: true })
    this.props.deleteTopic(removeModel.id).then(() => {
      this.setState({ removing: false, removeModel: null })
      this.props.getTopics()
    })
  }

  renderCount(topicId, type) {
    const { resources } = this.props
    if (resources.loading) return <Spinner small />

    const topicResources = resources.list.filter(
      r => r.type === type && r.topic === topicId,
    )
    console.log(topicResources)
    const nbFr = topicResources.filter(r => r.language === 'fr').length
    const nbEn = topicResources.filter(r => r.language === 'en').length

    const label =
      this.props.filters.language === 'fr'
        ? nbFr
        : this.props.filters.language === 'en'
        ? nbEn
        : `${nbFr} | ${nbEn}`

    if (nbFr + nbEn === 0)
      return <span className="topic-count topic-count-empty">{label}</span>

    return (
      <Link
        className={cx('topic-count', { 'topic-count-warning': nbFr !== nbEn })}
        to={`/resources/${type}/?topic=${topicId}`}>
        {label}
      </Link>
    )
  }

  getPreviewUrl(topic) {
    const host = process.env.REACT_APP_API_SERVER
    if (!host) {
      throw new Error(
        'INVALID CONFIGURATION: rebuild client with REACT_APP_API_SERVER env properly set',
      )
    }
    return `${host}/preview/topics/${topic.id}`
  }

  renderHeader() {
    return (
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <h1 className="title">
              <T id="bo.topics" />
            </h1>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <Link className="button is-primary" to={`/topics/new`}>
              <IconButton label="add" icon="plus" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  renderConfirm() {
    return (
      <Confirm
        model={this.state.removeModel}
        removing={this.state.removing}
        onClose={() => this.askRemove(null)}
        onConfirm={() => this.deleteModel()}
      />
    )
  }

  renderTable() {
    const { topics } = this.props
    const orderedTopics = topics.list.slice().sort((t1, t2) => t1.id - t2.id)

    return (
      <table className="table is-striped is-bordered is-fullwidth">
        <thead>
          <tr>
            <th className="fit">
              <T id="bo.resource-id" />
            </th>
            <th>
              <T
                id="bo.name"
                values={{
                  lang: this.props.filters.language
                    ? this.props.filters.language
                    : 'fr | en',
                }}
              />
            </th>
            <th>
              <T id="bo.resource" />
            </th>
            {SHOWN_TYPES.map(type => (
              <th className="fit" key={type}>
                <Icon icon={TYPE_ICON[type]} />
                <T id={'bo.type-' + type} />
              </th>
            ))}
            <th className="fit" />
          </tr>
        </thead>
        <tbody>
          {orderedTopics.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>
                {this.props.filters.language === 'fr'
                  ? t.name
                  : this.props.filters.language === 'en'
                  ? t.name_en
                  : `${t.name} | ${t.name_en}`}
              </td>
              <td>
                {t.resourceId && (
                  <Link to={`/resources/${t.resourceId}/edit`}>
                    {t.resourceId}
                  </Link>
                )}
              </td>
              {SHOWN_TYPES.map(type => (
                <td key={type}>{this.renderCount(t.id, type)}</td>
              ))}
              <td>
                <div className="field is-grouped">
                  <div className="control">
                    <Link
                      className="button is-primary"
                      to={`/topics/${t.id}/edit`}>
                      <IconButton icon="pencil" />
                    </Link>
                  </div>
                  <div className="control">
                    <button
                      className="button is-danger is-outlined"
                      onClick={() => this.askRemove(t)}>
                      <IconButton icon="times" />
                    </button>
                  </div>
                  <div className="control">
                    <a className="button" href={this.getPreviewUrl(t)}>
                      <IconButton icon="eye" />
                    </a>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  getMenuTo(params: { status?: ?string, topic?: ?number, type?: string }) {
    const pathname = '/topics'
    const search = Object.assign({}, params, { type: null, page: null })
    return updateLocation(this.props.history.location, { pathname, search })
  }

  renderLangMenu() {
    return (
      <ul className="menu-list lang-menu">
        <li key="all">
          <NavLink
            activeClassName="active"
            isActive={() => !this.props.filters.language}
            to={this.getMenuTo({ language: null })}>
            <T id="bo.type-all" />
          </NavLink>
        </li>
        {LOCALES.map(lang => (
          <li key={lang}>
            <NavLink
              activeClassName="active"
              isActive={() => lang === this.props.filters.language}
              to={this.getMenuTo({ language: lang })}>
              <Flag lang={lang} />
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderFilters() {
    return (
      <aside className="menu">
        <p className="menu-label">
          <T id="bo.resource-language" />
        </p>
        {this.renderLangMenu()}
      </aside>
    )
  }

  renderContent() {
    return (
      <div className="columns">
        <div className="column is-2">{this.renderFilters()}</div>
        <div className="column is-10">{this.renderTable()}</div>
      </div>
    )
  }

  render() {
    const { topics, resources } = this.props
    const loading = topics.loading || resources.loading

    return (
      <div className="Topics">
        {this.renderHeader()}
        {loading ? <Spinner /> : this.renderContent()}
        {this.renderConfirm()}
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ topics, resources }: AppState, { match }: ContextRouter) => {
      const { searchParams } = new URL(window.document.location)
      const filters: FiltersProps = {
        language: searchParams.get('language') || '',
      }
      return {
        filters,
        topics,
        resources,
      }
    },
    {
      getTopics,
      deleteTopic,
      fetchResources,
    },
  )(Topics),
)
