// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { getTopics, fetchResources } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

type Props = {
  topics: {
    loading: boolean,
    list: Array<Topic>,
  },
  resources: {
    loading: boolean,
    list: Array<Resource>,
  },
  // actions
  getTopics: typeof getTopics,
  fetchResources: typeof fetchResources,
}

class Topics extends Component<Props> {
  componentDidMount() {
    this.props.getTopics()
    this.props.fetchResources()
  }

  render() {
    const { topics, resources } = this.props

    const orderedList = topics.list
      .slice()
      .sort((t1, t2) => t1.order - t2.order)
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
                <th>
                  <T id="icon" />
                </th>
                <th>
                  <T id="name" />
                </th>
                <th>
                  <T id="articles" />
                </th>
                <th style={{ width: '1px' }} />
              </tr>
            </thead>
            <tbody>
              {orderedList.map(t => (
                <tr key={t.name}>
                  <td>
                    <img
                      alt="icon"
                      src={`/topics/pictos-parties_${t.id}.svg`}
                    />
                  </td>
                  <td>{t.name}</td>
                  <td>{Math.floor(Math.random() * 6) + 1}</td>
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
                        <button className="button is-danger is-outlined">
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
      </div>
    )
  }
}

export default connect(
  ({ topics, resources }: AppState) => ({ topics, resources }),
  {
    getTopics,
    fetchResources,
  },
)(Topics)
