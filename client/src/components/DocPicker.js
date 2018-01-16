// @flow

import React, { Component } from 'react'

import GooglePicker from 'react-google-picker'
import IconButton from './IconButton'
import loadScript from 'load-script'

const GOOGLE_SDK_URL = 'https://apis.google.com/js/api.js'
let scriptLoadingStarted = false

type State = {
  error: ?Error,
  result: ?any,
}

type Props = {
  onPick: (
    docs: Array<UploadDoc>,
    gapi: GoogleApi,
    viewToken: string,
  ) => Promise<any>,
  render: State => React$Element<any>,
  mimeTypes?: Array<string>,
  label?: string,
  icon?: string,
  showPickerAfterUpload?: boolean,
}

class Upload extends Component<Props, State> {
  state = { error: null, result: null }

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
        .then(() => window.gapi.auth2.getAuthInstance().signIn())
    })
  }

  callback = ({
    action,
    viewToken,
    docs,
  }: {
    action: string,
    viewToken: string,
    docs: Array<UploadDoc>,
  }) => {
    if (action !== 'picked') {
      return
    }

    this.props
      .onPick(docs, window.gapi, viewToken)
      .then(result => this.setState({ result }))
      .catch(error => this.setState({ error }))
  }

  renderPicker() {
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
            .setCallback(this.callback)
          picker.build().setVisible(true)
        }}
        mimeTypes={this.props.mimeTypes}>
        <button
          className="button is-primary"
          onClick={() => this.setState({ error: null, result: null })}>
          <IconButton
            label={this.props.label || 'to-import'}
            icon={this.props.icon || 'upload'}
          />
        </button>
      </GooglePicker>
    )
  }

  renderResult() {
    return this.props.render(this.state)
  }

  render() {
    const showResult = this.state.error || this.state.result
    const showPicker =
      (!this.state.error && !this.state.result) ||
      this.props.showPickerAfterUpload

    return (
      <div className="DocPicker">
        {showPicker && this.renderPicker()}
        {showResult && this.renderResult()}
      </div>
    )
  }
}

export default Upload
