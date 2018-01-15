// @flow

import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { addResourceFromGoogleDrive, getResource } from '../api'

import DocPicker from './DocPicker'

type Props = {
  type: ResourceType,
}

type State = {}

class ResourceForm extends Component<Props, State> {
  state = {}

  render() {
    const { type } = this.props

    return (
      <div className="ResourceForm">
        <h1>
          <T id="resource-create" values={{ type }} />
        </h1>
        {this.renderForm(type)}
      </div>
    )
  }

  upload([{ name, id: fileId }], gapi) {
    const type = this.props.type
    const accessToken = gapi.auth.getToken().access_token

    return addResourceFromGoogleDrive({ name, type, fileId, accessToken }).then(
      ({ id }) => getResource(id),
    )
  }

  renderError(error) {
    return (
      <p>
        <strong>Error: {error}</strong>
      </p>
    )
  }

  renderResource(resource) {
    return <pre>{JSON.stringify(resource, null, '  ')}</pre>
  }

  renderForm(type) {
    return (
      <Fragment>
        <DocPicker
          render={({ error, result }) =>
            error ? this.renderError(error) : this.renderResource(result)
          }
          onPick={(docs, gapi) => this.upload(docs, gapi)}
          showPickerAfterUpload={false}
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
  })(ResourceForm),
)
