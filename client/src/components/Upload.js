// @flow

import React, { Component } from 'react'

import GooglePicker from 'react-google-picker'

class Upload extends Component<{}> {
  render() {
    return (
      <GooglePicker
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        developerKey={process.env.REACT_APP_GOOGLE_DEV_KEY}
        scope={['https://www.googleapis.com/auth/drive.readonly']}
        onChange={data => console.log('on change:', data)}
        multiselect={true}
        navHidden={true}
        authImmediate={false}
        // mimeTypes={['image/png', 'image/jpeg', 'image/jpg']}
        viewId={'DOCS'}>
        <button className="button is-primary">picker</button>
      </GooglePicker>
    )
  }
}

export default Upload
