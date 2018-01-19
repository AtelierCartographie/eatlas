// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'

import { fetchResources } from './../actions'
import Spinner from './Spinner'
import ArticleForm from './ArticleForm'
import ResourceForm from './ResourceForm'
import { updateResource } from '../api'

import type { SaveCallback } from './ResourceForm'

type Props = ContextIntl & {
  resource: ?Resource,
  id: string,
  loading: boolean,
  shouldLoad: boolean,
  // Actions
  fetchResources: Function,
}

type State = {}

class ResourceEdit extends Component<Props, State> {
  state = {}

  componentDidMount() {
    if (this.props.shouldLoad) {
      this.props.fetchResources()
    }
  }

  render() {
    return (
      <div className="ResourceForm">
        <h1 className="title">
          <T {...this.getTitle()} />
        </h1>
        {this.renderForm()}
        {process.env.NODE_ENV === 'development' ? this.renderDebug() : null}
      </div>
    )
  }

  getTitle() {
    const { resource, id, loading, shouldLoad } = this.props

    if (loading || shouldLoad) {
      return { id: 'resource-edit-loading', values: { id } }
    }

    if (!resource) {
      return { id: 'resource-not-found', values: { id } }
    }

    return {
      id: 'resource-edit',
      values: {
        id: resource.id,
        type: this.props.intl.formatMessage({ id: 'type-' + resource.type }),
      },
    }
  }

  renderForm() {
    const { resource, loading, shouldLoad } = this.props

    if (loading || shouldLoad) {
      return <Spinner />
    }

    if (!resource) {
      return (
        <Link to="/resources">
          <T id="resources" />
        </Link>
      )
    }

    // TODO only use ResourceForm?
    if (resource.type === 'article' && resource.nodes) {
      return <ArticleForm article={resource} />
    }

    return <ResourceForm mode="edit" resource={resource} onSubmit={this.save} />
  }

  renderDebug() {
    const { resource } = this.props

    if (!resource) {
      return null
    }

    const keys = []
    const appendKeys = (object, prefix = []) => {
      Object.keys(object).forEach(k => {
        const k2 = prefix.concat(k)
        if (object[k] && typeof object[k] === 'object') {
          appendKeys(object[k], k2)
        } else {
          keys.push(k2)
        }
      })
    }
    appendKeys(resource)

    const get = (object: any, key: string[]) =>
      // $FlowFixMe: it seems like "o && typeof o === 'object'" is not enough to know it's an object
      key.reduce((o, k) => (o && typeof o === 'object' ? o[k] : null), object)

    return (
      <Fragment>
        <hr />
        <h1 className="title">Debug (development only)</h1>
        <table className="table">
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Type</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(key => {
              const k = key.join('.')
              const v = get(resource, key)
              return (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{typeof v}</td>
                  <td>{JSON.stringify(v)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <pre>{JSON.stringify(resource, null, '  ')}</pre>
      </Fragment>
    )
  }

  save: SaveCallback = async (resource, uploads, accessToken) => {
    if (!this.props.resource || !this.props.resource.id) {
      throw new Error('No resource to save!')
    }
    const id: string = this.props.resource.id

    return updateResource(id, {
      status: resource.status,
      // FIXME make id editable?
      // id: resource.id,
      title: resource.title,
      subtitle: resource.subtitle,
      topic: resource.topic,
      language: resource.language,
      description: resource.description,
      copyright: resource.copyright,
      uploads,
      accessToken,
    })
  }
}

export default withRouter(
  connect(
    ({ resources }: AppState, { match }) => {
      const { id } = match.params
      const { loading } = resources
      const resource = resources.list.find(r => r.id === id)
      const shouldLoad = !resource && !resources.fetched

      return { loading, shouldLoad, id, resource }
    },
    { fetchResources },
  )(injectIntl(ResourceEdit)),
)
