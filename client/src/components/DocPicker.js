// @flow

import React, { Component } from 'react'

import GooglePicker from 'react-google-picker'
import IconButton from './IconButton'
import loadScript from 'load-script'

const GOOGLE_SDK_URL = 'https://apis.google.com/js/api.js'
let scriptLoadingStarted = false

type Result = {
  resource?: Resource,
  data?: any,
}

type State = {
  error: ?Error,
  result: ?(Result & {
    docs: GoogleDoc[],
  }),
}

type OnPickFunction = (
  docs: GoogleDoc[],
  viewToken: string,
  gapi: GoogleApi,
) => Promise<Result>

type RenderFunction = State => ?React$Element<any>

type Props = {
  onPick?: OnPickFunction,
  render?: RenderFunction,
  mimeTypes?: Array<string>,
  label?: string,
  icon?: string,
  showPickerAfterUpload?: boolean,
  locale?: Locale,
  multiple?: boolean,
  search?: string,
}

type PickerData = {
  action: string,
  docs: Array<GoogleDoc>,
}

const initialState: State = { error: null, result: null }

class DocPicker extends Component<Props, State> {
  state = initialState

  viewToken: string

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

  callback = ({ action, docs }: PickerData) => {
    if (action !== 'picked') {
      return
    }

    if (!this.props.onPick) {
      this.setState({ result: { docs } })
    } else {
      this.props
        .onPick(docs, this.viewToken, window.gapi)
        .then(result => this.setState({ result: { docs, ...result } }))
        .catch(error => this.setState({ error }))
    }
  }

  setViewToken = (token: string) => {
    this.viewToken = token
  }

  renderPicker() {
    return (
      <GooglePicker
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        developerKey={process.env.REACT_APP_GOOGLE_DEV_KEY}
        scope={['https://www.googleapis.com/auth/drive']}
        onAuthenticate={this.setViewToken}
        onChange={this.callback}
        multiselect={this.props.multiple}
        createPicker={(google, oauthToken) => {
          const docsView = new google.picker.DocsView()
          //docsView.setEnableTeamDrives(true)
          //docsView.setIncludeFolders(true)
          if (this.props.mimeTypes) {
            docsView.setMimeTypes(this.props.mimeTypes.join(','))
          }
          if (this.props.search) {
            docsView.setQuery(this.props.search)
          }

          const uploadView = new google.picker.DocsUploadView()

          const picker = new google.picker.PickerBuilder()
            .setLocale(this.props.locale || 'en')
            .addView(docsView)
            .addView(uploadView)
            .enableFeature(
              this.props.multiple
                ? google.picker.Feature.MULTISELECT_ENABLED
                : google.picker.Feature.MULTISELECT_DISABLED,
            )
            .setOAuthToken(oauthToken)
            .setDeveloperKey(process.env.REACT_APP_GOOGLE_DEV_KEY)
            .setCallback(this.callback)

          picker.build().setVisible(true)
        }}>
        <a
          href="#!docpicker"
          className="button is-link is-outlined"
          onClick={() => this.setState(initialState)}>
          <IconButton
            label={this.props.label || 'to-import'}
            icon={this.props.icon || 'upload'}
          />
        </a>
      </GooglePicker>
    )
  }

  renderResult() {
    return this.props.render ? this.props.render(this.state) : null
  }

  render() {
    const showResult = this.state.error || this.state.result
    const showPicker =
      (!this.state.error && !this.state.result) ||
      this.props.showPickerAfterUpload

    return (
      <div className="DocPicker">
        {showPicker ? this.renderPicker() : null}
        {showResult ? this.renderResult() : null}
      </div>
    )
  }
}

export default DocPicker
