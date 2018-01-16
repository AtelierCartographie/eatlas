// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { addResourceFromGoogleDrive, getResource } from '../api'

import DocPicker from './DocPicker'

const mimeTypes = {
  article: [''],
  map: ['svg'],
  sound: ['?'], // TODO
  image: ['image/png'],
  video: ['?'], // TODO
}

type Props = {
  type: ResourceType,
}

type State = {
  doc?: UploadDoc,
}

class ResourceCreate extends Component<Props, State> {
  state = {}

  gapi: GoogleApi

  render() {
    const { type } = this.props

    return (
      <div className="ResourceCreate">
        <h1>
          <T id="resource-create" values={{ type }} />
        </h1>
        {this.renderForm(type)}
      </div>
    )
  }

  upload([{ name, id: fileId }]: Array<UploadDoc>, accessToken: string) {
    const type = this.props.type

    return addResourceFromGoogleDrive({ name, type, fileId, accessToken }).then(
      ({ id }) => getResource(id),
    )
  }

  renderError(error) {
    return (
      <p>
        <strong>Error: {error.message}</strong>
      </p>
    )
  }

  renderResult(result) {
    const { doc } = result

    return (
      <strong>
        {doc.name} ({doc.type})
      </strong>
    )
  }

  renderNone() {
    return <p>No selection</p>
  }

  onPick = async (doc, accessToken) => {
    return {}
  }

  renderForm(type) {
    return (
      <Fragment>
        <DocPicker
          render={({ error, result }) =>
            error
              ? this.renderError(error)
              : result ? this.renderResult(result) : this.renderNone()
          }
          onPick={this.onPick}
          mimeTypes={mimeTypes[this.props.type]}
          showPickerAfterUpload={true}
        />
        <p>TODO: form depending on type: {type}</p>
      </Fragment>
    )
  }
}

export default withRouter(
  connect(({ resources }, { match }) => {
    const type = match.params.type

    return { type }
  })(ResourceCreate),
)
