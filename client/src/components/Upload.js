// @flow

import React, { Component } from 'react'
import { addResourceFromGoogleDrive, getResource } from '../api'

import GooglePicker from 'react-google-picker'
import loadScript from 'load-script'

const GOOGLE_SDK_URL = 'https://apis.google.com/js/api.js'
let scriptLoadingStarted = false

class Upload extends Component<{}> {
  componentDidMount() {
    if (this.isGoogleReady()) {
      // google api is already exists
      // init immediately
      this.onApiLoad()
    } else if (!scriptLoadingStarted) {
      // load google api and the init
      scriptLoadingStarted = true
      loadScript(GOOGLE_SDK_URL, this.onApiLoad)
    } else {
      // is loading ????
    }
  }

  isGoogleReady() {
    return !!window.gapi
  }

  isGoogleAuthReady() {
    return !!window.gapi.auth
  }

  onApiLoad() {
    window.gapi.load('client:auth2', () => {
      window.gapi.client
        .init({
          apiKey: process.env.REACT_APP_GOOGLE_DEV_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
          scope: ['https://www.googleapis.com/auth/drive'],
        })
        .then(function() {
          window.gapi.auth2.getAuthInstance().signIn()
        })
    })
  }

  onPick(data: any) {
    if (!data.docs) {
      return
    }
    const fileId = data.docs[0].id
    const token = window.gapi.auth.getToken().access_token
    addResourceFromGoogleDrive(fileId, token)
      .then(({ id }) => {
        console.log('Conversion done, resource id', id)
        return getResource(id)
      })
      .then(res => {
        console.log('Full resource', res)
      })
      .catch(err => {
        console.error(err)
      })
  }

  render() {
    return (
      <GooglePicker
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        developerKey={process.env.REACT_APP_GOOGLE_DEV_KEY}
        scope={['https://www.googleapis.com/auth/drive']}
        createPicker={(google, oauthToken) => {
          const picker = new window.google.picker.PickerBuilder()
            .addView(new google.picker.View(google.picker.ViewId.DOCS))
            .addView(new google.picker.DocsUploadView())
            .setOAuthToken(oauthToken)
            .setDeveloperKey(process.env.REACT_APP_GOOGLE_DEV_KEY)
            .setCallback(this.onPick)
          picker.build().setVisible(true)
        }}
        // mimeTypes={['image/png', 'image/jpeg', 'image/jpg']}
      >
        <button className="button is-primary">picker</button>
      </GooglePicker>
    )
  }
}

export default Upload
