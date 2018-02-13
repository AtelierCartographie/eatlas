// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { getTopics, deleteTopic, fetchResources } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'
import Confirm from './Confirm'

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

  render() {
    const { topics, resources } = this.props

    const orderedList = topics.list.slice().sort((t1, t2) => t1.id - t2.id)
    const loading = topics.loading || resources.loading

    const articles = resources.list.filter(r => r.type === 'article')

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
                <th className="fit">
                  <T id="icon" />
                </th>
                <th>
                  <T id="name" />
                </th>
                <th className="fit">
                  <T id="type-article" />
                </th>
                <th className="fit" />
              </tr>
            </thead>
            <tbody>
              {orderedList.map(t => (
                <tr key={t.name}>
                  <td>{t.id}</td>
                  <td>
                    <img
                      alt="icon"
                      src={`/topics/${t.id}.svg`}
                    />
                  </td>
                  <td>{t.name}</td>
                  <td>
                    {resources.loading ? (
                      <Spinner small />
                    ) : (
                      articles.filter(r => r.topic === t.id).length
                    )}
                  </td>
                  <td>
                    <div className="field is-grouped">
                      <div className="control">
                        <Link
                          className="button is-primary"
                          to={`/topics/${t.id}/edit`}>
                          <IconButton label="edit" icon="pencil" />
                        </Link>
                      </div>
                      <div className="control">
                        <button
                          className="button is-danger is-outlined"
                          onClick={() => this.askRemove(t)}>
                          <IconButton label="delete" icon="times" />
                        </button>
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
