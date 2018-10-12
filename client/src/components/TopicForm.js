// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { toast } from 'react-toastify'

import './TopicForm.css'

import { getTopic, saveTopic } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'
import Editor from './WysiwygEditor'
import { topicName } from '../universal-utils'
import { LOCALES } from '../constants'

import type { ContextRouter } from 'react-router'

type Props = {
  loading: boolean,
  saving: boolean,
  topic: Topic,
  topicId: string, // From router
  lang: Locale,
  // actions
  getTopic: typeof getTopic,
  saveTopic: typeof saveTopic,
  // router
  redirect: Function,
}

type State = {
  topic: ?Topic,
  error: ?Error,
}

const newTopic = {
  id: 0,
  name: '',
  resourceId: '',
  description_fr: '',
  description_en: '',
}

class TopicForm extends Component<Props, State> {
  state = {
    topic: null,
    error: null,
  }

  componentDidMount() {
    // beware topicId can be 0
    if (this.props.topicId != null) {
      this.props.getTopic(this.props.topicId)
    } else {
      this.setState(() => ({ topic: newTopic }))
    }
  }

  componentWillReceiveProps({ topic }) {
    if (topic && !this.state.topic) {
      this.setState({ topic })
    }
  }

  handleChange = ({ target }) => {
    const { name, value } = target
    this.setState(state => ({
      topic: {
        ...state.topic,
        [name]: value,
      },
    }))
  }

  handleChangeDescription = (lang, value) => {
    this.setState(state => ({
      topic: {
        ...state.topic,
        [`description_${lang}`]: value,
      },
    }))
  }

  handleSubmit = evt => {
    evt.preventDefault()
    // already saving: cancel
    if (this.props.saving || !this.state.topic) return
    // legacy cleaning during the mediaUrl -> resourceId migration
    // $FlowFixMe
    delete this.state.topic.mediaUrl
    // legacy cleaning during the description -> description_fr migration
    // $FlowFixMe
    delete this.state.topic.description

    this.props.saveTopic(this.state.topic, this.props.topicId).then(
      () => {
        toast.success(<T id="bo.toast-topic-saved" />)
        this.props.redirect('/topics')
      },
      error => {
        this.setState({ error })
      },
    )
  }

  renderError(message: any) {
    return (
      <div className="notification is-danger">
        <strong>
          <T id="bo.error" />:
        </strong>
        {message}
      </div>
    )
  }

  render() {
    const { topicId, loading, saving } = this.props
    const { topic } = this.state

    return (
      <div className="TopicForm">
        <h1 className="title">
          <T id="bo.resource-topic" />{' '}
          {topic ? topicName(topic, this.props.locale) : ''}
        </h1>
        {saving && <Spinner />}
        {loading || !topic ? (
          <Spinner />
        ) : (
          <form onSubmit={this.handleSubmit}>
            {this.state.error
              ? this.renderError(this.state.error.message)
              : null}
            <div className="field">
              <label className="label">
                <T id="bo.resource-id" />
              </label>
              <div className="control">
                <input
                  className="input"
                  name="id"
                  type="number"
                  placeholder="id"
                  value={topic.id}
                  onChange={this.handleChange}
                  readOnly={this.props.topicId}
                  required
                />
              </div>
            </div>

            {LOCALES.map(lang => (
              <div key={lang} className="field">
                <label className="label">
                  <T id="bo.name" values={{ lang }} />
                </label>
                <div className="control">
                  <input
                    className="input"
                    name={lang === 'fr' ? 'name' : `name_${lang}`}
                    type="text"
                    value={topicName(topic, lang)}
                    onChange={this.handleChange}
                    required
                  />
                </div>
              </div>
            ))}

            {topicId != null && (
              <div className="field">
                <label className="label">
                  <T id="bo.resource" /> id
                </label>
                <div className="control">
                  <input
                    className="input"
                    name="resourceId"
                    type="text"
                    value={topic.resourceId}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
            )}

            {['fr', 'en'].map(lang => (
              <div className="field" key={lang}>
                <label className="label">
                  <T id="bo.resource-description" values={{ lang }} />
                </label>
                <div className="control">
                  <Editor
                    onChange={({ target }) =>
                      this.handleChangeDescription(lang, target.value)
                    }
                    value={topic[`description_${lang}`] || ''}
                  />
                </div>
              </div>
            ))}

            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary" disabled={saving}>
                  <IconButton label="validate" icon="check" />
                </button>
              </div>
              <div className="control">
                <Link className="button is-danger is-outlined" to="/topics">
                  <T id="bo.cancel" />
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default withRouter(
  connect(
    ({ topics, locale }: AppState, { match, history }: ContextRouter) => {
      const { id } = match.params
      const redirect = history.push.bind(history)
      return {
        loading: topics.loading,
        saving: topics.saving,
        topic: topics.list.find(t => t.id === id) || null,
        topicId: id === 'new' ? null : id,
        redirect,
        locale,
      }
    },
    { getTopic, saveTopic },
  )(TopicForm),
)
