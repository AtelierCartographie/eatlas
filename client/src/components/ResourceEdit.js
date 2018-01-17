// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'

import { fetchResources } from './../actions'
import Spinner from './Spinner'

type Props = {
  resource: ?Resource,
  id: string,
  loading: boolean,
  shouldLoad: boolean,
  // Actions
  fetchResources: Function,
}

type State = {}

class ResourceForm extends Component<Props, State> {
  state = {}

  componentDidMount() {
    if (this.props.shouldLoad) {
      this.props.fetchResources()
    }
  }

  render() {
    return (
      <div className="ResourceForm">
        <h1>
          <T {...this.getTitle()} />
        </h1>
        {this.renderContent()}
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

    return { id: 'resource-edit', values: resource }
  }

  renderContent() {
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

    let content = null
    if (resource.type === 'article' && resource.nodes) {
      content = (
        <Fragment>
          <strong>Nodes:</strong>
          <pre>{JSON.stringify(resource.nodes, null, '  ')}</pre>
        </Fragment>
      )
    } else if (resource.type === 'image' && resource.file) {
      content = (
        <img
          src={(process.env.REACT_APP_PUBLIC_PATH_image || '') + resource.file}
          alt={resource.file}
        />
      )
    } else {
      content = (
        <Fragment>
          <strong>Data:</strong>
          <pre>{JSON.stringify(resource, null, '  ')}</pre>
        </Fragment>
      )
    }

    return (
      <Fragment>
        <table className="table">
          <tbody>
            <tr>
              <th>id</th>
              <td>{resource.id}</td>
            </tr>
            <tr>
              <th>type</th>
              <td>{resource.type}</td>
            </tr>
          </tbody>
        </table>
        {content}
      </Fragment>
    )
  }
}

export default withRouter(
  connect(
    ({ resources }, { match, history }) => {
      const id = match.params.id
      const loading = resources.loading
      const resource = resources.list.find(r => r.id === id)
      const shouldLoad = !resource && !resources.fetched

      return { loading, shouldLoad, id, resource }
    },
    { fetchResources },
  )(ResourceForm),
)
