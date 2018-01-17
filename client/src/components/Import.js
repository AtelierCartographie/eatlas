// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import cx from 'classnames'
import withRouter from 'react-router/withRouter'
import { connect } from 'react-redux'

import { addResourceFromGoogleDrive } from '../api'
import DocPicker from './DocPicker'
import Icon from './Icon'

import type { ContextRouter } from 'react-router'

// TODO configurable list
const resourceType: { [string]: ResourceType } = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'article',
  'application/vnd.google-apps.document': 'article',
  'image/svg+xml': 'map',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'audio/mpeg': 'sound',
  'video/x-msvideo': 'video',
  'video/mpeg': 'video',
}

type Props = ContextRouter & {
  locale: Locale,
}

type State = {
  doc: ?UploadDoc,
  accessToken: ?string,
  type: ?ResourceType,
  resource: ?ResourceNew,
  saved: boolean,
  saving: boolean,
  error: ?Error,
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

class Import extends Component<Props, State> {
  state = {
    doc: null,
    resource: null,
    accessToken: null,
    type: null,
    saving: false,
    saved: false,
    error: null,
  }

  gapi: GoogleApi

  render() {
    const type = this.props.match.params.type

    return (
      <div className="ResourceCreate">
        <h1>
          <T id="resource-create" /> {type ? <T id={'type-' + type} /> : null}
        </h1>
        {this.state.error ? this.renderError(this.state.error.message) : null}
        <form onSubmit={this.onSubmit}>
          {this.renderDocSelector(type)}
          {this.renderMetadataForm()}
          {this.renderSave()}
        </form>
      </div>
    )
  }

  renderDocSelector(type) {
    const { doc, resource } = this.state

    if (!doc) {
      return this.renderPicker(type)
    }

    if (!resource) {
      return (
        <Fragment>
          {this.renderSelectedDoc(doc)}
          {this.renderError(
            <T id="error-invalid-resource-type" values={doc} />,
          )}
          {this.renderPicker(type)}
        </Fragment>
      )
    }

    return this.renderSelectedDoc(doc)
  }

  renderError(message: any) {
    return (
      <p>
        <strong>
          <T id="error" />:
        </strong>
        {message}
      </p>
    )
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

  renderPicker(type: ?string) {
    let mimeTypes = []
    if (type) {
      mimeTypes = Object.keys(resourceType).filter(
        mimeType => resourceType[mimeType] === type,
      )
    }

    return (
      <DocPicker
        locale={this.props.locale}
        label="select-file"
        onPick={this.onPick}
        showPickerAfterUpload={false}
        mimeTypes={mimeTypes}
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

  // TODO specific form for each resource type
  // - article → +nodes
  // - others?
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
                readOnly={this.state.saving}
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
              readOnly={this.state.saving}
              required
            />
          ),
        })}
      </Fragment>
    )
  }

  onChangeType = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      error: null,
      //$FlowFixMe I really don't want to list all possible values here
      resource: { ...this.state.resource, type: e.target.value },
    })
  }

  onChangeName = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      error: null,
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
        className={cx('button is-primary is-large', {
          'is-loading': this.state.saving,
        })}
        disabled={!this.isSaveable(resource)}>
        <Icon icon="check" />
        <span>
          <T id="save-changes" />
        </span>
      </button>
    )
  }

  // TODO implement more complex validations here?
  // Will probably dependon resource type
  isSaveable(resource: ResourceNew) {
    return resource.type && resource.name
  }

  onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { resource, doc, accessToken } = this.state

    if (!doc || !resource) {
      return // Nothing to do here
    }

    // TODO Redux (this is important to update store and make redirection actually work)
    this.setState({ saving: true, error: null })
    try {
      const { id } = await addResourceFromGoogleDrive({
        name: resource.name,
        fileId: doc.id,
        type: resource.type,
        mimeType: doc.mimeType,
        accessToken,
      })
      this.setState({ saving: false, error: null })
      this.props.history.push(`/resources/${id}/edit`)
    } catch (error) {
      this.setState({ saving: false, error })
    }
  }
}

export default withRouter(connect(({ locale }) => ({ locale }))(Import))
