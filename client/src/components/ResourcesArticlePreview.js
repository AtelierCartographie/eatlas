// @flow

import React, { Component, Fragment } from 'react'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'

import { fetchResources } from './../actions'
import { LEXICON_ID } from '../constants'
import { getDefinition } from '../utils'

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

    if (errors.length === 0) {
      return this.props.article.title
    }

    return (
      <Fragment>
        <Icon
          icon="warning"
          className="has-text-danger"
          title={this.props.intl.formatMessage(
            { id: 'article-errors' },
            { nb: errors.length },
          )}
        />
        {this.props.article.title}
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
    if (this.props.article.nodes) {
      const nodes: any[] = this.props.article.nodes // Need intermediate value for flow
      const lexicon = this.props.resources.find(r => r.id === LEXICON_ID)
      nodes.forEach(node => {
        if (node.lexicon) {
          node.lexicon.forEach(dt => {
            let dd
            if (lexicon) {
              dd = getDefinition(dt, lexicon.definitions)
            }
            if (!dd) {
              errors.push({ what: dt, type: 'definition-not-found' })
            }
          })
        }
        if (node.type === 'resource') {
          const resource: ?Resource = this.props.resources.find(
            r => r.id === node.id,
          )
          if (!resource) {
            errors.push({ what: node.id, type: 'resource-not-found' })
          } else if (resource.status !== 'published') {
            errors.push({ what: node.id, type: 'resource-not-published' })
          }
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
