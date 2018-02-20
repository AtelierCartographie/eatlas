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
import { updateResourceFromGoogleDrive, updateResource } from '../api'
import ObjectDebug from './ObjectDebug'
import IconButton from './IconButton'

import type { ContextRouter } from 'react-router'
import type { SaveCallback } from './ResourceForm'

type Props = ContextIntl &
  ContextRouter & {
    resource: ?Resource,
    id: string,
    loading: boolean,
    shouldLoad: boolean,
    // Actions
    fetchResources: Function,
  }

type State = {
  openDetails: boolean,
  openDefinition: ?string,
}

class ResourceEdit extends Component<Props, State> {
  state = { openDetails: false, openDefinition: null }

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

    // TODO for article? let renderBefore = null
    let renderAfter = null

    if (resource.type === 'definition' && resource.definitions) {
      renderAfter = this.renderDefinitions.bind(this, resource.definitions)
    } else if (resource.type === 'article' && resource.nodes) {
      renderAfter = this.renderNodes.bind(this, resource)
    } else if (resource.type === 'focus' && resource.nodes) {
      renderAfter = this.renderNodes.bind(this, resource)
    }

    return (
      <ResourceForm
        mode="edit"
        resource={resource}
        onSubmit={this.save}
        renderAfter={renderAfter}
      />
    )
  }

  renderNodes(article: any) {
    return <ArticleForm article={article} />
  }

  renderDefinitions(
    definitions: Array<{ dt: string, dd: string, resourceId?: string }>,
  ) {
    const { openDetails, openDefinition } = this.state

    const linkToResource = id => (
      <Fragment>
        {' ('}
        <Link to={`/resources/${id}/edit`}>{id}</Link>
        {')'}
      </Fragment>
    )

    const renderDefinition = dd => (
      <div className="control">
        <textarea className="textarea" readOnly>
          {dd}
        </textarea>
      </div>
    )

    const renderList = () =>
      definitions.map(({ dt, dd, resourceId }) => (
        <div key={dt} className="field">
          <label
            className="label"
            onClick={() => this.setState({ openDefinition: dt })}>
            <IconButton
              icon={openDefinition === dt ? 'caret-down' : 'caret-right'}
            />
            <em>{dt}</em>
            {resourceId ? linkToResource(resourceId) : null}
          </label>
          {openDefinition === dt && renderDefinition(dd)}
        </div>
      ))

    return (
      <section className="box">
        <h2 className="subtitle" onClick={this.toggleOpenDetails}>
          <IconButton icon={openDetails ? 'caret-down' : 'caret-right'} />
          <label>
            <T id="lexicon-description" values={{ nb: definitions.length }} />
          </label>
        </h2>
        {openDetails && renderList()}
      </section>
    )
  }

  toggleOpenDetails = () =>
    this.setState(state => ({ openDetails: !state.openDetails }))

  save: SaveCallback = async (resource, uploads, accessToken) => {
    if (!this.props.resource || !this.props.resource.id) {
      throw new Error('No resource to save!')
    }
    const id: string = this.props.resource.id

    const result = !accessToken
      ? await updateResource(id, {
          // $FlowFixMe
          status: resource.status,
          title: resource.title,
          subtitle: resource.subtitle,
          topic: resource.topic,
          language: resource.language,
          description: resource.description,
          copyright: resource.copyright,
          mediaUrl: resource.mediaUrl,
        })
      : await updateResourceFromGoogleDrive(id, {
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
          // TODO should we send parsed result? Currently, doc is parsed twice by server
        })

    this.props.history.push('/resources?sort=createdAt&dir=desc')

    return result
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
