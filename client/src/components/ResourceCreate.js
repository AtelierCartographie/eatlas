// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import { addResourceFromGoogleDrive, addResource } from '../api'
import ResourceForm from './ResourceForm'

import type { ContextRouter } from 'react-router'
import type { SaveCallback } from './ResourceForm'

type Props = ContextRouter & {
  forcedType: ?ResourceType,
  initialId: ?string,
}

class ResourceCreate extends Component<Props> {
  render() {
    return (
      <div className="ResourceCreate">
        <h1 className="title">
          <T id="bo.resource-create" />
        </h1>
        <ResourceForm
          mode="create"
          onSubmit={this.save}
          resource={{ type: this.props.forcedType, id: this.props.initialId }}
        />
      </div>
    )
  }

  save: SaveCallback = async (resource, uploads, accessToken) => {
    // some types like video does not pick docs on GDrive
    const result = !accessToken
      ? await addResource(resource)
      : await addResourceFromGoogleDrive({
          ...resource,
          uploads,
          accessToken,
        })

    this.props.history.goBack()

    return result
  }
}

export default withRouter(
  connect(({ locale }: AppState, { match, location }: ContextRouter) => ({
    forcedType: match.params.type,
    initialId: location.search.substring(1),
  }))(ResourceCreate),
)
