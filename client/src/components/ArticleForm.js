// @flow

import './ArticleForm.css'

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import Icon from './Icon'
import IconButton from './IconButton'
import { renderPreview } from './Resources'
import { LEXICON_ID } from '../constants'

// TODO proper typing
type ANode = any
type AMeta = any

type RProps = {
  node: Object,
  resource: Object,
  onIsMissing: (exists: boolean, published: boolean) => any,
}

class _ResourceField extends Component<RProps> {
  componentDidMount() {
    if (!this.props.resource) {
      return this.props.onIsMissing(false, false)
    }
    const published = this.props.resource.status === 'published'
    return this.props.onIsMissing(true, published)
  }

  render() {
    const { node, resource } = this.props

    if (!resource) {
      return (
        <div className="field">
          <label className="label has-text-danger">
            <Icon icon="warning" />
            Resource not found
          </label>
          <div className="control">
            {node.id} {node.text}
          </div>
          <Link to={'/resources/new/?' + node.id}>
            Create resource {node.id}
          </Link>
        </div>
      )
    }

    let preview = renderPreview(resource)

    if (resource.status !== 'published') {
      return (
        <div className="field">
          <label className="label has-text-danger">
            <Icon icon="warning" />
            Unpublished resource {resource.type}
          </label>
          <div className="control">{preview}</div>
          <div className="control">
            <Link to={`/resources/${resource.id}/edit`}>
              Publish resource {resource.id}
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="field">
        <label className="label">Resource {resource.type}</label>
        <div className="control">{preview}</div>
        <div className="control">
          <Link to={`/resources/${resource.id}/edit`}>
            Edit resource {resource.id}
          </Link>
        </div>
      </div>
    )
  }
}

const ResourceField = connect(({ resources }, { node }) => ({
  resource: resources.list.find(r => r.id === node.id),
}))(_ResourceField)

type PProps = {
  node: Object,
  definitions: ?({ dt: string, dd: string }[]),
  onIsMissing: (dt: string, missingLexicon: boolean) => any,
}

class _ParagraphField extends Component<PProps> {
  render() {
    const { node } = this.props
    return (
      <div className="field">
        <label className="label">Paragraph</label>
        <div className="columns">
          <div className="column">
            <div className="control">
              <textarea className="textarea" defaultValue={node.text} />
            </div>
          </div>
          <div className="column">
            {!node.links.length ? null : (
              <div>
                <label className="label">Links</label>
                <ul>
                  {node.links.map(l => (
                    <li key={l.label}>
                      <a href={l.url}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!node.lexicon.length ? null : (
              <div>
                <label className="label">Lexicon</label>
                <ul>{node.lexicon.map(this.renderDefinition)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderDefinition = dt => {
    const dd = this.getDefinition(dt)
    return (
      <li key={dt}>
        {dd ? (
          <abbr title={dd}>{dt}</abbr>
        ) : (
          <span className="has-text-danger">
            <Icon icon="warning" />
            {' ' + dt}
          </span>
        )}
      </li>
    )
  }

  componentDidMount() {
    const { node } = this.props
    if (node && node.lexicon) {
      node.lexicon.forEach(dt => {
        if (!this.props.definitions) {
          return this.props.onIsMissing(dt, true)
        }
        const dd = this.getDefinition(dt)
        if (!dd) {
          this.props.onIsMissing(dt, false)
        }
      })
    }
  }

  getDefinition(dt) {
    const search = dt.toLowerCase()
    if (!this.props.definitions) {
      return null
    }
    const found = this.props.definitions.find(
      def => def.dt.toLowerCase() === search,
    )
    return found && found.dd
  }
}

const ParagraphField = connect(({ resources }, { node }) => {
  const lexicon = resources.list.find(r => r.id === LEXICON_ID)
  return { definitions: lexicon ? lexicon.definitions : null }
})(_ParagraphField)

type Props = {
  article: any,
}

type State = {
  missingResources: [ANode, boolean][],
  missingDefinitions: string[],
  missingLexicon: boolean,
  previewMode: boolean,
}

class ArticleForm extends Component<Props, State> {
  state = {
    missingResources: [],
    missingDefinitions: [],
    previewMode: false,
    missingLexicon: false,
  }

  renderHeader(node: ANode, k: string) {
    return (
      <div className="field" key={k}>
        <label className="label">Header</label>
        <div className="control">
          <input className="input" defaultValue={node.text} />
        </div>
      </div>
    )
  }

  renderParagraph(node: ANode, k: string) {
    return (
      <ParagraphField
        onIsMissing={this.onIsMissingDefinition}
        node={node}
        key={k}
      />
    )
  }

  renderResource(node: ANode, k: string) {
    return (
      <ResourceField
        onIsMissing={this.onIsMissingResource(node)}
        node={node}
        key={k}
      />
    )
  }

  onIsMissingResource = (node: ANode) => (
    exists: boolean,
    published: boolean,
  ) => {
    this.setState(state => ({
      missingResources: state.missingResources
        .filter(r => r[0].id !== node.id)
        .concat(exists && published ? [] : [[node, exists]]),
    }))
  }

  renderMissingResources() {
    const nodes = this.state.missingResources

    if (nodes.length === 0) {
      return null
    }

    return (
      <Fragment>
        <h2 className="subtitle">Missing resources</h2>
        <ul>
          {nodes.map(([node, exists]) => (
            <li key={node.id}>
              <label className="has-text-danger">
                <Icon icon="warning" />
                <strong className="has-text-danger">{node.id}</strong>
              </label>
              <Link
                to={
                  exists
                    ? `/resources/${node.id}/edit`
                    : `/resources/new/?${node.id}`
                }>
                {' '}
                {exists ? `Publish “${node.text}”` : `Create “${node.text}”`}
              </Link>
            </li>
          ))}
        </ul>
      </Fragment>
    )
  }

  onIsMissingDefinition = (dt: string, missingLexicon: boolean) => {
    console.log({ dt })
    this.setState(state => {
      const newState = {
        missingLexicon,
        missingDefinitions: state.missingDefinitions,
      }
      if (!state.missingDefinitions.includes(dt)) {
        newState.missingDefinitions = state.missingDefinitions.concat([dt])
      }
      return newState
    })
  }

  renderMissingDefinitions() {
    const dts = this.state.missingDefinitions.slice().sort()
    const hasMissingResources = this.state.missingResources.length > 0

    if (dts.length === 0) {
      return null
    }

    return (
      <Fragment>
        {hasMissingResources && <hr />}
        <h2 className="subtitle">Missing definitions</h2>
        <p>
          You have to{' '}
          <Link
            to={
              this.state.missingLexicon
                ? '/resources/new/definition'
                : '/resources/' + LEXICON_ID + '/edit'
            }>
            upload a new lexicon
          </Link>{' '}
          providing those definitions:
        </p>
        <ul>
          {dts.map(dt => (
            <li key={dt}>
              <label className="has-text-danger">
                <Icon icon="warning" />
              </label>
              <em>{dt}</em>
            </li>
          ))}
        </ul>
      </Fragment>
    )
  }

  renderFootnotes(node: ANode, k: string) {
    return (
      <div className="field" key={k}>
        <label className="label">Footnotes</label>
        <div className="control">
          <ul>{node.list.map((f, k) => <li key={k}>{f.text}</li>)}</ul>
        </div>
      </div>
    )
  }

  renderMeta(meta: AMeta, k: string) {
    // Do not display metas handled in ResourceForm
    if (
      ['title', 'type', 'author', 'topic', 'id', 'summary-fr'].includes(
        meta.type,
      )
    ) {
      return null
    }

    if (meta.list) {
      return (
        <div className="field" key={k}>
          <label className="label">{meta.type}</label>
          <ul>{meta.list.map((kw, k) => <li key={k}>{kw.text}</li>)}</ul>
        </div>
      )
    }

    const field = meta.type.match(/^summary/) ? (
      <textarea className="textarea">{meta.text}</textarea>
    ) : (
      <input className="input" defaultValue={meta.text} />
    )

    return (
      <div className="field" key={k}>
        <label className="label">{meta.type}</label>
        <div className="control">{field}</div>
      </div>
    )
  }

  renderForm() {
    const { article } = this.props
    return (
      <div className="ArticleForm">
        {this.renderMissingResources()}
        {this.renderMissingDefinitions()}

        <hr />
        <h2 className="subtitle">Metas</h2>
        {article.metas.map(this.renderMeta)}

        <hr />
        <h2 className="subtitle">Content</h2>
        {article.nodes.map((node, k) => {
          switch (node.type) {
            case 'header':
              return this.renderHeader(node, k)

            case 'p':
              return this.renderParagraph(node, k)

            case 'resource':
              return this.renderResource(node, k)

            case 'footnotes':
              return this.renderFootnotes(node, k)

            default:
              return null
          }
        })}
      </div>
    )
  }

  getPreviewUrl() {
    const host = process.env.REACT_APP_API_SERVER
    if (!host) {
      throw new Error(
        'INVALID CONFIGURATION: rebuild client with REACT_APP_API_SERVER env properly set',
      )
    }
    return `${host}/resources/${this.props.article.id}/preview`
  }

  renderPreview() {
    return (
      <iframe
        title="Preview"
        width="100%"
        height="700px"
        src={this.getPreviewUrl()}
      />
    )
  }

  render() {
    return (
      <Fragment>
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-outlined"
              onClick={() =>
                this.setState({ previewMode: !this.state.previewMode })
              }>
              {this.state.previewMode ? (
                <IconButton label="hide-preview" icon="eye-slash" />
              ) : (
                <IconButton label="show-preview" icon="eye" />
              )}
            </button>
          </div>
          <div className="control">
            <button className="button is-primary" disabled={true}>
              <IconButton label="publish" icon="play" />
            </button>
          </div>
        </div>

        <div>
          <Icon icon="share" />
          <T id="share-preview" />{' '}
          <a href={this.getPreviewUrl()}>{this.getPreviewUrl()}</a>
        </div>

        <hr />

        {this.state.previewMode ? this.renderPreview() : this.renderForm()}
      </Fragment>
    )
  }
}

export default ArticleForm
