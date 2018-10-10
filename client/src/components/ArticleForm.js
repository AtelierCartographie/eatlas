// @flow

import './ArticleForm.css'

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { FormattedMessage as T } from 'react-intl'

import Icon from './Icon'
import IconButton from './IconButton'
import { renderPreview } from './Resources'
import { LEXICON_ID, META_CONVERSION } from '../constants'
import { getDefinition, parseRelated } from '../utils'
import { fetchResources } from '../actions'

type RProps = {
  node: Object,
  resource: Object,
  onIsMissing: (exists: boolean, published: boolean) => any,
}

class _ResourceField extends Component<RProps> {
  triggerIsMissing({ resource, onIsMissing }) {
    if (!resource) {
      return onIsMissing(false, false)
    }
    return onIsMissing(true, resource.status === 'published')
  }

  componentDidMount() {
    this.triggerIsMissing(this.props)
  }

  componentWillReceiveProps(props) {
    if (props.resource !== this.props.resource) {
      this.triggerIsMissing(props)
    }
  }

  render() {
    const { node, resource } = this.props

    if (!resource) {
      return (
        <div className="field">
          <label className="label has-text-danger">
            <Icon icon="warning" />
            <T id="bo.article-resource-not-found" values={node} />
          </label>
          <div className="control">
            {node.id} {node.text}
          </div>
          <Link to={'/resources/new/?' + node.id}>
            <T id="bo.article-related-create" values={{ title: node.id }} />
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
            <T id="bo.article-resource-unpublished" values={node} />
          </label>
          <div className="control">{preview}</div>
          <div className="control">
            <Link to={`/resources/${resource.id}/edit`}>
              <T
                id="bo.article-related-publish"
                values={{ title: resource.id }}
              />
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="field">
        <label className="label">
          <T id="bo.article-resource" values={node} />
        </label>
        <div className="control">{preview}</div>
        <div className="control">
          <Link to={`/resources/${resource.id}/edit`}>
            <T id="bo.article-related-edit" values={resource} />
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
    const control = (
      <div className="control">
        <p className="textarea">{node.text}</p>
      </div>
    )
    const hasColumns = node.links.length > 0 || node.lexicon.length > 0

    // No column: take whole width
    if (!hasColumns) {
      return (
        <div className="field">
          <label className="label">
            <T id="bo.article-content-paragraph" />
          </label>
          {control}
        </div>
      )
    }

    return (
      <div className="field">
        <label className="label">
          <T id="bo.article-content-paragraph" />
        </label>
        <div className="columns">
          <div className="column">{control}</div>
          <div className="column">
            {!node.links.length ? null : (
              <div>
                <label className="label">
                  <T id="bo.article-content-links" />
                </label>
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
                <label className="label">
                  <T id="bo.article-content-lexicon" />
                </label>
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
  const lexicon = resources.list.find(r => r.id === `${LEXICON_ID}-FR`)
  return { definitions: lexicon ? lexicon.definitions : null }
})(_ParagraphField)

const reverseMetaKey = ({ type }) => {
  for (let key in META_CONVERSION) {
    if (META_CONVERSION[key] === type) {
      return key
    }
  }
  return type
}

type Props = {
  article: Resource,
  resources: {
    list: Resource[],
    loading: boolean,
    fetched: boolean,
  },
  onNotPublishable?: string => void,
  fetchResources: Function,
}

type State = {
  missingResources: [ArticleNode, boolean][],
  missingDefinitions: string[],
  missingLexicon: boolean,
  missingRelated: { [string]: [ArticleNode, boolean] },
  expanded: boolean,
}

class ArticleForm extends Component<Props, State> {
  state = {
    missingResources: [],
    missingDefinitions: [],
    missingRelated: this.computeMissingRelated(
      this.props.article,
      this.props.resources.list,
    ),
    missingLexicon: false,
    expanded: false,
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

  // TODO use getResourceIds from 'universal-utils'
  computeMissingRelated(article: Resource, resources: Resource[]) {
    const result = {}
    const meta =
      article.metas && article.metas.find(meta => meta.type === 'related')
    if (meta && meta.list) {
      meta.list.forEach(({ text: string }) => {
        if (string) {
          const { id, text } = parseRelated(string)
          if (id) {
            const resource: ?Resource = resources.find(r => r.id === id)
            if (!resource || resource.status !== 'published') {
              const node: ArticleNode = {
                id,
                text: text || '',
                type: 'resource',
              }
              result[string] = [node, !!resource]
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
        <label className="label">
          <T id="bo.article-content-header" />
        </label>
        <div className="control">
          <span className="input">{node.text}</span>
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
    if (exists && published) return

    // Missing resource prevent publication (except for focus which can be published whatsoever)
    const isFocus = this.props.article.type === 'focus'
    const isMandatory = !isFocus // Focus are not mandatory, to avoid circular dependency
    if (this.props.onNotPublishable && isMandatory) {
      this.props.onNotPublishable('bo.article-error-missing-resource')
    }
  }

  renderMissingResources(title: string, nodes: [ArticleNode, boolean][]) {
    if (nodes.length === 0) return null

    return (
      <Fragment>
        <h2 className="subtitle is-4">
          <T id={title} /> ({nodes.length})
        </h2>
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
                <T
                  id={
                    exists
                      ? 'bo.article-related-publish'
                      : 'bo.article-related-create'
                  }
                  values={{ title: node.text }}
                />
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
        <h2 className="subtitle is-4">
          <T id="bo.article-missing-definitions" values={{ nb: dts.length }} />
        </h2>
        <p>
          <T id="bo.article-upload-lexicon-1" />{' '}
          <Link
            to={
              this.state.missingLexicon
                ? '/resources/new/definition'
                : '/resources/' + `${LEXICON_ID}-FR` + '/edit'
            }>
            <T id="bo.article-upload-lexicon-2" />
          </Link>{' '}
          <T id="bo.article-upload-lexicon-3" />
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
        <label className="label">
          <T id="bo.article-content-footnotes" />
        </label>
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
      [
        'title',
        'type',
        'author',
        'topic',
        'id',
        'summary-fr',
        'summary-en',
      ].includes(meta.type)
    ) {
      return null
    }

    if (meta.type === 'image-header') {
      return this.renderResource(
        { type: 'resource', id: meta.text, text: reverseMetaKey(meta) },
        0,
      )
    }

    if (meta.type === 'related-article') {
      return this.renderResource(
        { type: 'resource', id: meta.text, text: reverseMetaKey(meta) },
        0,
      )
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
          <label className="label">{reverseMetaKey(meta)}</label>
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
      <p className="textarea">{meta.text}</p>
    ) : (
      <span className="input">{meta.text}</span>
    )

    return (
      <div className="field" key={k}>
        <label className="label">{reverseMetaKey(meta)}</label>
        <div className="control">{field}</div>
      </div>
    )
  }

  render() {
    return (
      <div className="ArticleForm">
        {this.renderMissingResources(
          `bo.${this.props.article.type}-missing-resources`,
          this.state.missingResources,
        )}
        {this.renderMissingResources(
          `bo.${this.props.article.type}-missing-related`,
          // $FlowFixMe: TODO polyfill
          Object.values(this.state.missingRelated),
        )}
        {this.renderMissingDefinitions()}
        <h2
          className="subtitle is-3 content-details-expander"
          onClick={() => this.setState({ expanded: !this.state.expanded })}>
          <IconButton
            icon={this.state.expanded ? 'caret-down' : 'caret-right'}
          />{' '}
          <T id="bo.article-more-details" />
        </h2>
        {this.renderMoreDetails(this.state.expanded)}
      </div>
    )
  }

  renderMoreDetails(expanded = false) {
    // Note: we always render the whole thing, hidden if required
    // because relation errors are diagnosed on render
    const { article } = this.props
    const out = (
      <Fragment>
        <h3 className="subtitle is-4">
          <T id="bo.article-content-metas" />
        </h3>
        {article.metas && article.metas.map(this.renderMeta)}

        <hr />
        <h3 className="subtitle is-4">
          <T id="bo.article-content-content" />
        </h3>
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
      </Fragment>
    )

    return expanded ? out : <div style={{ display: 'none' }}>{out}</div>
  }
}

export default connect(
  ({ resources }: AppState) => ({ resources }),
  {
    fetchResources,
  },
)(ArticleForm)
