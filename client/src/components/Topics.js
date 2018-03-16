// @flow

import './Topics.css'

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { getTopics, deleteTopic, fetchResources } from './../actions'
import IconButton from './IconButton'
import Icon from './Icon'
import Spinner from './Spinner'
import Confirm from './Confirm'
import VimeoIframe from './VimeoIframe'
import { RESOURCE_TYPES, TYPE_ICON } from '../constants'

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
    if (this.props.resources.loading) {
      return <Spinner small />
    }

    const nb = this.props.resources.list.filter(
      r => r.type === type && r.topic === topicId,
    ).length

    if (nb === 0) {
      return <span className="topic-count">0</span>
    }

    return (
      <Link className="topic-count" to={`/resources/${type}/?topic=${topicId}`}>
        {nb}
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

  render() {
    const { topics, resources } = this.props

    const orderedList = topics.list.slice().sort((t1, t2) => t1.id - t2.id)
    const loading = topics.loading || resources.loading

    return (
      <div className="Topics">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">
                <T id="topics" />
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
        {loading ? (
          <Spinner />
        ) : (
          <table className="table is-striped is-bordered is-fullwidth">
            <thead>
              <tr>
                <th className="fit">
                  <T id="resource-id" />
                </th>
                <th>
                  <T id="name" />
                </th>
                <th>
                  <T id="preview" />
                </th>
                {SHOWN_TYPES.map(type => (
                  <th className="fit" key={type}>
                    <Icon icon={TYPE_ICON[type]} />
                    <T id={'type-' + type} />
                  </th>
                ))}
                <th className="fit" />
              </tr>
            </thead>
            <tbody>
              {orderedList.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.mediaUrl ? <VimeoIframe url={t.mediaUrl} name={t.name} /> : null }</td>
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
                        <a
                          className="button"
                          href={this.getPreviewUrl(t)}>
                          <IconButton icon="eye" />
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Confirm
          model={this.state.removeModel}
          removing={this.state.removing}
          onClose={() => this.askRemove(null)}
          onConfirm={() => this.deleteModel()}
        />
      </div>
    )
  }
}

export default connect(
  ({ topics, resources }: AppState) => ({ topics, resources }),
  {
    getTopics,
    deleteTopic,
    fetchResources,
  },
)(Topics)
