// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import Spinner from './Spinner'
import Icon from './Icon'

type Props = {
  promise: Promise<any>,
  render: any => Node,
}

type State = {
  status: 'loading' | 'success' | 'error',
  error: ?string,
  data: ?any,
}

class AsyncData extends Component<Props, State> {
  state = { status: 'loading', error: null, data: null }

  renderLoading() {
    return <Spinner />
  }

  renderError(error: ?string) {
    return (
      <span className="has-text-danger">
        <Icon icon="warning" />
        {error}
      </span>
    )
  }

  renderSuccess(data: ?any) {
    return this.props.render(data)
  }

  onSuccess = (data: any) => this.setState({ data, status: 'success' })
  onError = (error: { message: string }) =>
    this.setState({ error: error.message, status: 'error' })

  componentWillMount() {
    this.props.promise.then(this.onSuccess, this.onError)
  }

  render() {
    switch (this.state.status) {
      case 'loading':
        return this.renderLoading()
      case 'success':
        return this.renderSuccess(this.state.data)
      case 'error':
        return this.renderError(this.state.error)
      default:
        return this.renderError('Invalid status "' + this.state.status + '"')
    }
  }
}

export default AsyncData
