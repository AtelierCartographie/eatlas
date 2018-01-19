// @flow

import './ArticleForm.css'

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import Icon from './Icon'
import { renderPreview } from './Resources'

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
        <label className="label">Resource</label>
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

type Props = {
  article: any,
}

type State = {
  missingResources: ANode[],
}

class ArticleForm extends Component<Props, State> {
  state = { missingResources: [] }

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
      <div className="field" key={k}>
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
                <ul>{node.lexicon.map(l => <li key={l}>{l}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
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

  render() {
    const { article } = this.props
    return (
      <div className="ArticleForm">
        <h1 className="title">Article form</h1>

        {this.renderMissingResources()}

        <h2 className="subtitle">Metas</h2>
        {article.metas.map(this.renderMeta)}

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
}

export default ArticleForm
