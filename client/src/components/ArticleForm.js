// @flow

import './ArticleForm.css'

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

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
  onIsMissing: boolean => any,
}

class _ResourceField extends Component<RProps> {
  componentDidMount() {
    this.props.onIsMissing(!this.props.resource)
  }

  render() {
    const { node, resource } = this.props

    if (!resource) {
      return (
        <div className="field">
          <label className="label has-text-danger">
            Resource not found <Icon icon="warning" />
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
  definitions: { dt: string, dd: string }[],
  onIsMissing: boolean => any,
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

  getDefinition(dt) {
    const search = dt.toLowerCase()
    const found = this.props.definitions.find(
      def => def.dt.toLowerCase() === search,
    )
    return found && found.dd
  }
}

const ParagraphField = connect(({ resources }, { node }) => {
  const lexicon = resources.list.find(r => r.id === LEXICON_ID)
  return { definitions: (lexicon && lexicon.definitions) || [] }
})(_ParagraphField)

type Props = {
  article: any,
}

type State = {
  missingResources: ANode[],
  previewMode: boolean,
}

class ArticleForm extends Component<Props, State> {
  state = { missingResources: [], previewMode: false }

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
    return <ParagraphField node={node} key={k} />
  }

  renderResource(node: ANode, k: string) {
    return (
      <ResourceField onIsMissing={this.onIsMissing(node)} node={node} key={k} />
    )
  }

  onIsMissing = (node: ANode) => (missing: boolean) => {
    this.setState(state => ({
      missingResources: state.missingResources
        .filter(r => r.id !== node.id)
        .concat(missing ? [node] : []),
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
          {nodes.map(node => (
            <li key={node.id}>
              <label className="has-text-danger">
                <Icon icon="warning" />
                <strong className="has-text-danger">{node.id}</strong>
              </label>
              <Link to={'/resources/new/?' + node.id}>
                {' '}
                Import “{node.text}”
              </Link>
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
    if (meta.list) {
      return (
        <div className="field" key={k}>
          <label className="label">{meta.type}</label>
          <ul>{meta.list.map((kw, k) => <li key={k}>{kw.text}</li>)}</ul>
        </div>
      )
    }
    return (
      <div className="field" key={k}>
        <label className="label">{meta.type}</label>
        <div className="control">
          <input className="input" defaultValue={meta.text} />
        </div>
      </div>
    )
  }

  renderForm() {
    const { article } = this.props
    return (
      <div className="ArticleForm">
        {this.renderMissingResources()}

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

  renderPreview() {
    // TODO
    return (
      <iframe
        title="Preview"
        width="100%"
        height="700px"
        src={`http://localhost:4000/resources/${this.props.article.id}/preview`}
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

        <hr />

        {this.state.previewMode ? this.renderPreview() : this.renderForm()}
      </Fragment>
    )
  }
}

export default ArticleForm
