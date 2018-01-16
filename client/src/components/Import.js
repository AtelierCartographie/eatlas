// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import { addResourceFromGoogleDrive } from '../api'
import cx from 'classnames'

import DocPicker from './DocPicker'
import Icon from './Icon'
import withRouter from 'react-router/withRouter'

import type { ContextRouter } from 'react-router'

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

type Props = ContextRouter

type State = {
  doc: ?UploadDoc,
  accessToken: ?string,
  type: ?ResourceType,
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
    accessToken: null,
    type: null,
  }

  gapi: GoogleApi

  render() {
    return (
      <div className="ResourceCreate">
        <h1>
          <T id="resource-create" />
        </h1>
        {this.renderForm()}
      </div>
    )
  }

  renderForm() {
    return (
      <form onSubmit={this.onSubmit}>
        {this.renderDocSelector()}
        {this.renderMetadataForm()}
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
          readOnly={true}
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
      <span className="icon is-small is-left">
        <i className={`fa fa-${leftIcon}`} />
      </span>
    ) : null
    const $rightIcon = rightIcon ? (
      <span className="icon is-small is-right">
        <i className={`fa fa-${rightIcon}`} />
      </span>
    ) : null
    const $action = action ? (
      <div className="control">
        <button
          className={cx('button', `is-${action.buttonType || 'primary'}`)}
          onClick={action.onClick}>
          <span className="icon">
            <i className={`fa fa-${action.icon}`} />
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
    return (
      <DocPicker
        label="select-file"
        onPick={this.onPick}
        showPickerAfterUpload={false}
      />
    )
  }

  unselectFile = () => {
    this.setState({ doc: null })
  }

  onPick = async (doc: UploadDoc, accessToken: string) => {
    this.setState({ doc, accessToken, resource: this.guessResource(doc) })
    return {}
  }

  guessResource(doc: ?UploadDoc) {
    if (!doc) {
      return null
    }

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
      return null
    }

    return (
      <Fragment>
        {this.field({
          label: 'resource-type',
          leftIcon: 'info',
          input: (
            <div className="select is-fullwidth">
              <select
                name="type"
                onChange={this.onChangeType}
                value={resource.type}
                required>
                <option value="article">
                  <T id="type-article" />
                </option>
                <option value="map">
                  <T id="type-map" />
                </option>
                <option value="image">
                  <T id="type-image" />
                </option>
                <option value="video">
                  <T id="type-video" />
                </option>
                <option value="sound">
                  <T id="type-sound" />
                </option>
              </select>
            </div>
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
              onChange={this.onChangeName}
              required
            />
          ),
        })}
      </Fragment>
    )
  }

  onChangeType = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      //$FlowFixMe I really don't want to list all possible values here
      resource: { ...this.state.resource, type: e.target.value },
    })
  }

  onChangeName = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      resource: { ...this.state.resource, name: e.target.value },
    })
  }

  renderSave() {
    const { doc, resource } = this.state

    if (!doc || !resource) {
      return null
    }

    return (
      <button
        className="button is-primary is-large"
        disabled={!this.isSaveable(resource)}>
        <Icon icon="check" />
        <span>
          <T id="save-changes" />
        </span>
      </button>
    )
  }

  // TODO implement more complex validations here?
  isSaveable(resource: ResourceNew) {
    return resource.type && resource.name
  }

  onSubmit = async () => {
    const { resource, doc, accessToken } = this.state

    if (!doc || !resource) {
      return // Nothing to do here
    }

    // TODO Redux
    const { id } = await addResourceFromGoogleDrive({
      name: resource.name,
      fileId: doc.id,
      type: resource.type,
      accessToken,
    })

    this.props.history.push(`/resources/${id}/edit`)
  }
}

export default withRouter(Import)
