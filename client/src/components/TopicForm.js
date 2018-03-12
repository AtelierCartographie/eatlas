// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { toast } from 'react-toastify'

import { getTopic, saveTopic } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

import type { ContextRouter } from 'react-router'

type Props = {
  loading: boolean,
  saving: boolean,
  topic: Topic,
  topicId: string, // From router
  // actions
  getTopic: typeof getTopic,
  saveTopic: typeof saveTopic,
  // router
  redirect: Function,
}

type State = {
  topic?: Topic,
}

const newTopic = {
  id: 0,
  name: '',
  mediaUrl: '',
}

class TopicForm extends Component<Props, State> {
  state = {}

  componentDidMount() {
    if (this.props.topicId) {
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

  handleSubmit = evt => {
    evt.preventDefault()
    if (this.props.saving) {
      return // already saving: cancel
    }

    this.props.saveTopic(this.state.topic, this.props.topicId).then(() => {
      toast.success(<T id="toast-topic-saved" />)
      this.props.redirect('/topics')
    })
  }

  render() {
    const { loading, saving } = this.props
    const { topic } = this.state

    return (
      <div className="TopicForm">
        <h1 className="title">Topic {topic ? topic.name : ''}</h1>
        {saving && <Spinner />}
        {loading || !topic ? (
          <Spinner />
        ) : (
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label">
                <T id="resource-id" />
              </label>
              <div className="control">
                <input
                  className="input"
                  name="id"
                  type="number"
                  placeholder="id"
                  value={topic.id}
                  onChange={this.handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">
                <T id="name" />
              </label>
              <div className="control">
                <input
                  className="input"
                  name="name"
                  type="text"
                  placeholder="name"
                  value={topic.name}
                  onChange={this.handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">
                <T id="resource-mediaUrl" />
              </label>
              <div className="control">
                <input
                  className="input"
                  name="mediaUrl"
                  type="text"
                  placeholder="video"
                  value={topic.mediaUrl}
                  onChange={this.handleChange}
                />
              </div>
            </div>

            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary" disabled={saving}>
                  <IconButton label="validate" icon="check" />
                </button>
              </div>
              <div className="control">
                <Link className="button is-danger is-outlined" to="/topics">
                  <T id="cancel" />
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
    ({ topics }: AppState, { match, history }: ContextRouter) => {
      const { id } = match.params
      const redirect = history.push.bind(history)
      return {
        loading: topics.loading,
        saving: topics.saving,
        topic: topics.list.find(t => t.id === id) || null,
        topicId: id === 'new' ? null : id,
        redirect,
      }
    },
    { getTopic, saveTopic },
  )(TopicForm),
)
