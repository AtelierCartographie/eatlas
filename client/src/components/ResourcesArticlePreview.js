// @flow

import React, { Component, Fragment } from 'react'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'

import { fetchResources } from './../actions'
import { LEXICON_ID } from '../constants'
import { getDefinition, parseRelated } from '../utils'

import Html from './preview/Html'
import Icon from './Icon'

type Props = ContextIntl & {
  article: Resource,
  shouldFetchResources: boolean,
  loading: boolean,
  resources: Resource[],
  fetchResources: Function,
}

class ResourcesPreviewArticle extends Component<Props> {
  componentDidMount() {
    if (this.props.shouldFetchResources) {
      this.props.fetchResources()
    }
  }

  render() {
    const errors = this.getArticleErrors()
    const title = <Html component="div">{this.props.article.title}</Html>

    if (!errors.length) return title

    return (
      <Fragment>
        {title}
        <Icon icon="warning" className="has-text-danger" />
        <span>
          {this.props.intl.formatMessage(
            { id: 'article-errors' },
            { nb: errors.length },
          )}
        </span>
      </Fragment>
    )
  }

  getArticleErrors() {
    const errors: Array<{
      what: string,
      type:
        | 'definition-not-found'
        | 'resource-not-found'
        | 'resource-not-published',
    }> = []

    // checkers

    const checkResource = id => {
      const resource: ?Resource = this.props.resources.find(r => r.id === id)
      if (!resource) {
        errors.push({
          what: id,
          type: 'resource-not-found',
        })
      } else if (resource.status !== 'published') {
        errors.push({
          what: id,
          type: 'resource-not-published',
        })
      }
    }

    const lexicon = this.props.resources.find(r => r.id === LEXICON_ID)
    const checkDefinition = dt => {
      let dd
      if (lexicon) {
        dd = getDefinition(dt, lexicon.definitions)
      }
      if (!dd) {
        errors.push({ what: dt, type: 'definition-not-found' })
      }
    }

    // loops

    if (this.props.article.metas) {
      const metas: ArticleMeta[] = this.props.article.metas // Intermediate value for Flow
      metas.forEach(meta => {
        if (meta.type === 'image-header') {
          checkResource(meta.text)
        } else if (meta.type === 'related') {
          meta.list.forEach(({ text }) => {
            const { id } = parseRelated(text)
            if (id) {
              checkResource(id)
            }
          })
        } else if (meta.type === 'related-article') {
          checkResource(meta.text)
        }
      })
    }

    if (this.props.article.nodes) {
      const nodes: any[] = this.props.article.nodes // Need intermediate value for flow
      nodes.forEach(node => {
        if (node.lexicon) {
          node.lexicon.forEach(checkDefinition)
        }
        if (node.type === 'resource') {
          checkResource(node.id)
        }
      })
    }
    return errors
  }
}

export default connect(
  ({ resources }: AppState) => ({
    shouldFetchResources: !resources.fetched,
    loading: resources.loading,
    resources: resources.list,
  }),
  { fetchResources },
)(injectIntl(ResourcesPreviewArticle))
