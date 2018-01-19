// @flow

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'

import { fetchResources } from './../actions'
import Spinner from './Spinner'
import ArticleForm from './ArticleForm'
import ResourceForm from './ResourceForm'
import { updateResource } from '../api'
import ObjectDebug from './ObjectDebug'

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
        <ObjectDebug object={this.props.resource} title="Resource" />
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

  save: SaveCallback = async (resource, uploads, accessToken) => {
    if (!this.props.resource || !this.props.resource.id) {
      throw new Error('No resource to save!')
    }
    const id: string = this.props.resource.id

    return updateResource(id, {
      // $FlowFixMe: resource is not a ResourceNew but a Resource, dumbass
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
