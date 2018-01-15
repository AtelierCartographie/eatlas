// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { addResourceFromGoogleDrive, getResource } from '../api'

import DocPicker from './DocPicker'

const onPick = ([{ name, id: fileId }], gapi) => {
  const type = 'article'
  const accessToken = gapi.auth.getToken().access_token

  return addResourceFromGoogleDrive({ name, type, fileId, accessToken }).then(
    ({ id }) => getResource(id),
  )
}

const render = ({ error, result }) => {
  if (error) {
    return (
      <p>
        <strong>Error: {error.message}</strong>
      </p>
    )
  }

  return <pre>{JSON.stringify(result, null, '  ')}</pre>
}

class Upload extends Component {
  render() {
    return (
      <DocPicker
        render={render}
        onPick={onPick}
        showPickerAfterUpload={false}
      />
    )
  }
}

export default Upload
