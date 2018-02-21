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
import { getDefinition } from '../utils'
import { fetchResources } from '../actions'

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
  definitions: ?Array<Definition>,
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
    const dd = getDefinition(dt, this.props.definitions)
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
        const dd = getDefinition(dt, this.props.definitions)
        if (!dd) {
          this.props.onIsMissing(dt, false)
        }
      })
    }
  }
}

const ParagraphField = connect(({ resources }, { node }) => {
  const lexicon = resources.list.find(r => r.id === LEXICON_ID)
  return { definitions: lexicon ? lexicon.definitions : null }
})(_ParagraphField)

type Props = {
  article: Resource,
  resources: {
    list: Resource[],
    loading: boolean,
    fetched: boolean,
  },
  fetchResources: Function,
}

type State = {
  missingResources: [ArticleNode, boolean][],
  missingDefinitions: string[],
  missingLexicon: boolean,
  missingRelated: { [string]: [ArticleNode, boolean] },
  previewMode: boolean,
}

class ArticleForm extends Component<Props, State> {
  state = {
    missingResources: [],
    missingDefinitions: [],
    missingRelated: this.computeMissingRelated(
      this.props.article,
      this.props.resources.list,
    ),
    previewMode: false,
    missingLexicon: false,
  }

  componentDidMount() {
    if (!this.props.resources.fetched) {
      this.props.fetchResources()
    }
  }

  componentWillReceiveProps(props: Props) {
    this.setState({
      missingRelated: this.computeMissingRelated(
        props.article,
        props.resources.list,
      ),
    })
  }

  // TODO put back every link-handling (resources & definitions) in this method?
  computeMissingRelated(article: Resource, resources: Resource[]) {
    const result = {}
    const meta =
      article.metas && article.metas.find(meta => meta.type === 'related')
    if (meta && meta.list) {
      meta.list.forEach(({ text }) => {
        if (text) {
          const match = text.match(/^\s*(.*?)\s*-\s*(.*?)\s*$/)
          if (match) {
            const id = match[1]
            const resource: ?Resource = resources.find(r => r.id === id)
            if (!resource || resource.status !== 'published') {
              const node: ArticleNode = {
                id,
                text: match[2],
                type: 'resource',
              }
              result[text] = [node, !!resource]
            }
          }
        }
      })
    }
    return result
  }

  renderHeader(node: ArticleNode, k: number) {
    return (
      <div className="field" key={k}>
        <label className="label">Header</label>
        <div className="control">
          <input className="input" defaultValue={node.text} />
        </div>
      </div>
    )
  }

  renderParagraph(node: ArticleNode, k: number) {
    return (
      <ParagraphField
        onIsMissing={this.onIsMissingDefinition}
        node={node}
        key={k}
      />
    )
  }

  renderResource(node: ArticleNode, k: number) {
    return (
      <ResourceField
        onIsMissing={this.onIsMissingResource(node)}
        node={node}
        key={k}
      />
    )
  }

  onIsMissingResource = (node: ArticleNode) => (
    exists: boolean,
    published: boolean,
  ) => {
    this.setState(state => ({
      missingResources: state.missingResources
        .filter(r => r[0].id !== node.id)
        .concat(exists && published ? [] : [[node, exists]]),
    }))
  }

  renderMissingResources(title: string, nodes: [ArticleNode, boolean][]) {
    if (nodes.length === 0) {
      return null
    }

    return (
      <Fragment>
        <h2 className="subtitle">{title}</h2>
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
        <hr />
      </Fragment>
    )
  }

  onIsMissingDefinition = (dt: string, missingLexicon: boolean) => {
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

    if (dts.length === 0) {
      return null
    }

    return (
      <Fragment>
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
        <hr />
      </Fragment>
    )
  }

  renderFootnotes(node: ArticleNode, k: number) {
    return (
      <div className="field" key={k}>
        <label className="label">Footnotes</label>
        <div className="control">
          <ul>
            {node.list && node.list.map((f, k) => <li key={k}>{f.text}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  renderMeta = (meta: ArticleMeta, k: number) => {
    // Do not display metas handled in ResourceForm
    if (
      ['title', 'type', 'author', 'topic', 'id', 'summary-fr'].includes(
        meta.type,
      )
    ) {
      return null
    }

    const renderMetaRelated = text =>
      this.state.missingRelated[text] ? (
        <span className="has-text-danger">
          <Icon icon="warning" /> {text}
        </span>
      ) : (
        text
      )

    if (meta.list) {
      return (
        <div className="field" key={k}>
          <label className="label">{meta.type}</label>
          <div className="box">
            <ul className="fa-ul">
              {meta.list.map((kw, k) => (
                <li key={k}>
                  {meta.type === 'related'
                    ? renderMetaRelated(kw.text)
                    : kw.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    const field = meta.type.match(/^summary/) ? (
      <pre className="textarea">{meta.text}</pre>
    ) : (
      <span className="input">{meta.text}</span>
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
        {this.renderMissingResources(
          'Missing resources',
          this.state.missingResources,
        )}
        {this.renderMissingResources(
          'Missing related',
          // $FlowFixMe: TODO polyfill
          Object.values(this.state.missingRelated),
        )}
        {this.renderMissingDefinitions()}

        <h2 className="subtitle">Metas</h2>
        {article.metas && article.metas.map(this.renderMeta)}

        <hr />
        <h2 className="subtitle">Content</h2>
        {article.nodes &&
          article.nodes.map((node, k) => {
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
              onClick={e => {
                e.preventDefault()
                this.setState({ previewMode: !this.state.previewMode })
              }}>
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

export default connect(({ resources }: AppState) => ({ resources }), {
  fetchResources,
})(ArticleForm)
