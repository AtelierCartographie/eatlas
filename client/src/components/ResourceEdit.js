// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'

import './ResourceEdit.css'

import { fetchResources } from './../actions'
import Spinner from './Spinner'
import ArticleForm from './ArticleForm'
import ResourceForm from './ResourceForm'
import { updateResource } from '../api'
import ObjectDebug from './ObjectDebug'
import IconButton from './IconButton'
import Icon from './Icon'

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
  openPreview: boolean,
  publishable: boolean,
  whyUnpublishable: string[],
}

class ResourceEdit extends Component<Props, State> {
  state = {
    openDetails: false,
    openDefinition: null,
    openPreview: false,
    publishable: true,
    whyUnpublishable: [],
  }

  componentDidMount() {
    if (this.props.shouldLoad) {
      this.props.fetchResources()
    }
  }

  componentWillReceiveProps(nextProps) {
    // trigger during a article -> add/edit resource
    // without this reset, a validated resource cannot be published
    if (this.props.id !== nextProps.id) {
      this.setState({
        publishable: true,
        whyUnpublishable: [],
      })
    }
  }

  render() {
    return (
      <div className="ResourceEdit">
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

    let renderAfterForm = null
    let renderBeforeForm = null

    if (resource.type === 'definition' && resource.definitions) {
      renderAfterForm = this.renderDefinitions.bind(this, resource.definitions)
    } else if (resource.type === 'article' && resource.nodes) {
      renderBeforeForm = this.renderPreview.bind(this)
      renderAfterForm = this.renderNodes.bind(this, resource)
    } else if (resource.type === 'focus' && resource.nodes) {
      renderBeforeForm = this.renderPreview.bind(this)
      renderAfterForm = this.renderNodes.bind(this, resource)
    }

    return (
      <ResourceForm
        mode="edit"
        resource={resource}
        onSubmit={this.save}
        renderBeforeForm={renderBeforeForm}
        renderAfterForm={renderAfterForm}
        publishable={this.state.publishable}
        whyUnpublishable={this.state.whyUnpublishable}
      />
    )
  }

  renderNodes(article: any) {
    return (
      <Fragment>
        <hr />
        <ArticleForm
          article={article}
          onUnpublishable={reason =>
            this.setState(state => ({
              publishable: false,
              whyUnpublishable: state.whyUnpublishable
                .filter(text => text !== reason)
                .concat([reason]),
            }))
          }
        />
      </Fragment>
    )
  }

  renderDefinitions(
    definitions: Array<{ dt: string, dd: string, aliases: Array<any> }>,
  ) {
    const { openDetails, openDefinition } = this.state

    const renderDefinition = dd => (
      <div className="control">
        <textarea className="textarea" readOnly>
          {dd}
        </textarea>
      </div>
    )

    const renderAliases = aliases => {
      if (!aliases || aliases.length === 0) return null
      return (
        <small>
          {' ('}
          {aliases.join(', ')}
          {')'}
        </small>
      )
    }

    const renderList = () =>
      definitions.map(({ dt, dd, aliases }) => (
        <div key={dt} className="field">
          <label
            className="label"
            onClick={() => this.setState({ openDefinition: dt })}>
            <IconButton
              icon={openDefinition === dt ? 'caret-down' : 'caret-right'}
            />
            <em>{dt}</em>
            {renderAliases(aliases)}
          </label>
          {openDefinition === dt && renderDefinition(dd)}
        </div>
      ))

    return (
      <Fragment>
        <hr />
        <section className="definitions-box">
          <h2 className="subtitle" onClick={this.toggleOpenDetails}>
            <IconButton icon={openDetails ? 'caret-down' : 'caret-right'} />
            <label>
              <T id="lexicon-description" values={{ nb: definitions.length }} />
            </label>
          </h2>
          {openDetails && renderList()}
        </section>
      </Fragment>
    )
  }

  getPreviewUrl() {
    const host = process.env.REACT_APP_API_SERVER
    if (!host) {
      throw new Error(
        'INVALID CONFIGURATION: rebuild client with REACT_APP_API_SERVER env properly set',
      )
    }
    if (!this.props.resource) return ''
    return `${host}/preview/resources/${this.props.resource.id}`
  }

  renderPreview() {
    return (
      <Fragment>
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-outlined"
              onClick={e => {
                e.preventDefault()
                this.setState({ openPreview: !this.state.openPreview })
              }}>
              {this.state.openPreview ? (
                <IconButton label="hide-preview" icon="eye-slash" />
              ) : (
                <IconButton label="show-preview" icon="eye" />
              )}
            </button>
          </div>

          <div>
            <Icon icon="share" />
            <T id="share-preview" />{' '}
            <a href={this.getPreviewUrl()}>{this.getPreviewUrl()}</a>
          </div>
        </div>
        {this.state.openPreview && (
          <iframe
            title="Preview"
            width="100%"
            height="700px"
            src={this.getPreviewUrl()}
          />
        )}
      </Fragment>
    )
  }

  toggleOpenDetails = () =>
    this.setState(state => ({ openDetails: !state.openDetails }))

  save: SaveCallback = async (resource, uploads, accessToken) => {
    if (!this.props.resource || !this.props.resource.id) {
      throw new Error('No resource to save!')
    }
    const id: string = this.props.resource.id

    // TODO should we send parsed result? Currently article is parsed twice by server
    const result = await updateResource(id, {
      // $FlowFixMe: resource is not a ResourceNew but a Resource, dumbass
      status: resource.status,
      author: resource.author,
      title: resource.title,
      subtitle: resource.subtitle,
      topic: resource.topic,
      language: resource.language,
      description: resource.description,
      transcript: resource.transcript,
      copyright: resource.copyright,
      mediaUrl: resource.mediaUrl,
      uploads,
      accessToken,
    })

    // redirect
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
