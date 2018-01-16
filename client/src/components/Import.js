// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { addResourceFromGoogleDrive, getResource } from '../api'
import cx from 'classnames'

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

type FieldParams = {
  label: string,
  leftIcon?: string,
  rightIcon?: string,
  input: React$Element<any>,
  action?: {
    icon: string,
    onClick: Function,
    buttonType?: string,
  },
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
    return this.field({
      label: 'selected-file',
      leftIcon: 'file',
      input: (
        <input
          className="input"
          type="text"
          placeholder="type"
          value={`${doc.name} (#${doc.id})`}
          readonly={true}
          required
        />
      ),
      action: {
        icon: 'remove',
        buttonType: 'danger',
        onClick: this.unselectFile,
      },
    })
  }

  field({ label, leftIcon, rightIcon, input, action }: FieldParams) {
    const ctrlClass = cx('control', {
      'is-expanded': action,
      'has-icons-left': leftIcon,
      'has-icons-right': rightIcon,
    })
    const $leftIcon = leftIcon ? (
      <span class="icon is-small is-left">
        <i class={`fa fa-${leftIcon}`} />
      </span>
    ) : null
    const $rightIcon = rightIcon ? (
      <span class="icon is-small is-right">
        <i class={`fa fa-${rightIcon}`} />
      </span>
    ) : null
    const $action = action ? (
      <div className="control">
        <button
          className={cx('button', `is-${action.buttonType || 'primary'}`)}
          onClick={action.onClick}>
          <span class="icon">
            <i class={`fa fa-${action.icon}`} />
          </span>
        </button>
      </div>
    ) : null

    return (
      <Fragment>
        <label className="label">
          <T id={label} />
        </label>
        <div className={cx('field', { 'has-addons': action })}>
          <div className={ctrlClass}>
            {input}
            {$leftIcon}
            {$rightIcon}
          </div>
          {$action}
        </div>
      </Fragment>
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
        {this.field({
          label: 'resource-type',
          leftIcon: 'info',
          input: (
            <input
              className="input"
              name="type"
              type="text"
              placeholder="type"
              value={resource.type}
              readonly={true}
              required
            />
          ),
        })}
        {this.field({
          label: 'resource-code',
          leftIcon: 'key',
          input: (
            <input
              className="input"
              name="name"
              type="text"
              placeholder="unique code"
              value={resource.name}
              required
            />
          ),
        })}
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
