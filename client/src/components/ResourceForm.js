// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'

import { fetchResources } from './../actions'
import IconButton from './IconButton'
import Spinner from './Spinner'

type Props = {
  action: 'create' | 'edit',
  resource: ?Resource,
  id: ?string,
  type: ?ResourceType,
  loading: boolean,
  fetched: boolean,
  shouldLoad: boolean,
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
    const {
      action,
      id,
      resource,
      type,
      loading,
      shouldLoad,
      fetched,
    } = this.props

    if (loading || shouldLoad) {
      return { id: 'resource-edit-loading', values: { id } }
    }

    if (action === 'edit' && !resource) {
      return { id: 'resource-not-found', values: { id } }
    }

    if (action === 'edit') {
      return { id: 'resource-edit', values: resource }
    }

    if (action === 'create') {
      return { id: 'resource-create', values: { type } }
    }
  }

  renderContent() {
    const { action, resource, type, loading, shouldLoad, fetched } = this.props

    if (loading || shouldLoad) {
      return <Spinner />
    }

    if (action === 'edit' && !resource) {
      return (
        <Link to="/resources">
          <T id="resources" />
        </Link>
      )
    }

    if (action === 'edit') {
      return (
        <Fragment>
          <table>
            <tbody>
              <tr>
                <th>id</th>
                <td>{resource.id}</td>
              </tr>
              <tr>
                <th>name</th>
                <td>{resource.name}</td>
              </tr>
              <tr>
                <th>type</th>
                <td>{resource.type}</td>
              </tr>
            </tbody>
          </table>
          <pre>{JSON.stringify(resource, null, '  ')}</pre>
        </Fragment>
      )
    }

    if (action === 'create') {
      return <p>TODO: form depending on type</p>
    }
  }
}

export default withRouter(
  connect(
    ({ resources }, { match, history }) => {
      const id = match.params.id
      const resource =
        id && !loading ? resources.list.find(r => r.id === id) : null
      const type = resource ? resource.type : match.params.type
      const fetched = resources.fetched
      const action = id ? 'edit' : 'create'
      const shouldLoad = action === 'edit' && !fetched
      const loading = resources.loading

      return { loading, shouldLoad, fetched, action, id, type, resource }
    },
    { fetchResources },
  )(ResourceForm),
)
