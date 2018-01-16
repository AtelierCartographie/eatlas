// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { addResourceFromGoogleDrive, getResource } from '../api'

import DocPicker from './DocPicker'
import IconButton from './IconButton'
import Icon from './Icon'

// TODO configurable list
const resourceType: { [string]: ResourceType } = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'article',
  'image/svg+xml': 'map',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'audio/mpeg': 'sound',
  'video/x-msvideo': 'video',
  'video/mpeg': 'video',
}

type Props = {}

type State = {
  doc: ?UploadDoc,
  viewToken: ?string,
  type: ?ResourceType,
  saveable: ?boolean,
  resource: ?ResourceNew,
}

const initialDoc = {
  id: '1xRv-TIW2r64sPp_2CyOsdZrKwQgECxpF',
  serviceId: 'docs',
  mimeType: 'image/png',
  name: 'tmp-no-entry-2.png',
  description: '',
  type: 'photo',
  lastEditedUtc: 1516028294500,
  iconUrl: 'https://drive-thirdparty.googleusercontent.com/16/type/image/png',
  url:
    'https://drive.google.com/file/d/1xRv-TIW2r64sPp_2CyOsdZrKwQgECxpF/view?usp=drive_web',
  embedUrl:
    'https://drive.google.com/file/d/1xRv-TIW2r64sPp_2CyOsdZrKwQgECxpF/preview?usp=drive_web',
  sizeBytes: 556,
  rotation: 0,
  rotationDegree: 0,
  parentId: '0AFalxNPyUWElUk9PVA',
}

class Import extends Component<Props, State> {
  state = {
    doc: initialDoc,
    resource: this.guessResource(initialDoc),
    viewToken: null,
    type: null,
    saveable: false,
  }

  gapi: GoogleApi

  render() {
    return (
      <div className="ResourceCreate">
        <h1>
          <T id="resource-create" values={{ type: this.state.type }} />
        </h1>
        {this.renderForm()}
      </div>
    )
  }

  renderForm() {
    return (
      <form onSubmit={this.onSubmit}>
        <h2>1. Select doc</h2>
        {this.renderDocSelector()}
        <h2>2. Edit meta-data</h2>
        {this.renderMetadataForm()}
        <h2>3. Save</h2>
        {this.renderSave()}
      </form>
    )
  }

  renderDocSelector() {
    const { doc, resource } = this.state

    if (!doc) {
      return this.renderPicker()
    }

    if (!resource) {
      return (
        <Fragment>
          {this.renderSelectedDoc(doc)}
          <p>
            <strong>Error:</strong> Resource type invalid: please select another
            doc.
          </p>
          {this.renderPicker()}
        </Fragment>
      )
    }

    return this.renderSelectedDoc(doc)
  }

  renderSelectedDoc(doc: UploadDoc) {
    return (
      <p>
        Selected file:{' '}
        <a href={doc.embedUrl} target="_blank">
          <strong>{doc.name}</strong> (#{doc.id})
        </a>
        <button
          className="button is-small is-danger is-outlined"
          onClick={this.unselectFile}>
          <IconButton icon="remove" size="small" />
        </button>
      </p>
    )
  }

  renderPicker() {
    return <DocPicker onPick={this.onPick} showPickerAfterUpload={false} />
  }

  unselectFile = () => {
    this.setState({ doc: null })
  }

  onPick = async (doc: UploadDoc, viewToken: string) => {
    this.setState({ doc, viewToken, resource: this.guessResource(doc) })
    return {}
  }

  guessResource(doc: UploadDoc) {
    const type = resourceType[doc.mimeType]

    if (!type) {
      return null
    }

    return {
      name: doc.name.replace(/\..*$/, ''),
      type,
    }
  }

  renderMetadataForm() {
    const { doc, resource } = this.state

    if (!doc || !resource) {
      return <p>You must select a valid file first</p>
    }

    return (
      <Fragment>
        <div className="field">
          <label className="label">type</label>
          <div className="control has-icons-left">
            <input
              className="input"
              name="type"
              type="text"
              placeholder="type"
              value={resource.type}
              readonly={true}
              required
            />
            <Icon icon="info" size="small" />
          </div>
        </div>
        <div className="field">
          <label className="label">code</label>
          <div className="control has-icons-left">
            <input
              className="input"
              name="name"
              type="text"
              placeholder="unique code"
              value={resource.name}
              required
            />
            <Icon icon="key" size="small" />
          </div>
        </div>
      </Fragment>
    )
  }

  renderSave() {
    const { doc, saveable } = this.state

    if (!doc) {
      return <p>You must select a file first</p>
    }

    if (!saveable) {
      return <p>You must properly fill metadata first</p>
    }

    return <button>TODO save button</button>
  }

  onSubmit = () => {}

  async upload(doc: UploadDoc, accessToken: string) {
    const type = this.state.type

    const { id } = await addResourceFromGoogleDrive({
      name: doc.name,
      fileId: doc.id,
      type,
      accessToken,
    })

    return getResource(id)
  }
}

export default Import
