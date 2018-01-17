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
const mimeTypes: { [ResourceType]: string[] } = {
  article: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.document',
  ],
  map: ['image/svg+xml'],
  image: ['image/jpeg', 'image/png', 'image/gif'],
  sound: ['audio/mpeg'],
  video: ['video/x-msvideo', 'video/mpeg'],
}

type Props = ContextRouter & {
  locale: Locale,
}

type State = {
  doc: ?UploadDoc,
  accessToken: ?string,
  resource: ?ResourceNew,
  saved: boolean,
  saving: boolean,
  error: ?Error,
}

type FieldParams = {
  labelId: string,
  labelValues?: Object,
  leftIcon?: string,
  rightIcon?: string,
  input: React$Element<any>,
  action?: {
    icon: string,
    onClick: Function,
    buttonType?: string,
  },
  key?: string,
}

const field = ({
  labelId,
  labelValues,
  leftIcon,
  rightIcon,
  input,
  action,
  key,
}: FieldParams) => {
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
    <div className="control" key={key || labelId}>
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
    <Fragment key={key || labelId}>
      <label className="label">
        <T id={labelId} values={labelValues} />
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

class Import extends Component<Props, State> {
  initialResource: ?ResourceNew = this.props.match.params.type
    ? {
        // $FlowFixMe
        type: this.props.match.params.type,
        id: '',
      }
    : null

  state: State = {
    doc: null,
    resource: this.initialResource,
    accessToken: null,
    saving: false,
    saved: false,
    error: null,
  }

  gapi: GoogleApi

  render() {
    const { value: type, readOnly } = this.getType()

    return (
      <div className="ResourceCreate">
        <h1>
          <T id="resource-create" />
        </h1>
        {this.state.error ? this.renderError(this.state.error.message) : null}
        <form onSubmit={this.onSubmit}>
          {this.renderSelectType(type, readOnly || this.state.saving)}
          {this.renderForm(this.state.resource, this.state.saving)}
          {this.renderSave()}
        </form>
      </div>
    )
  }

  getType(): { readOnly: boolean, value: ?ResourceType } {
    const stateType = this.state.resource && this.state.resource.type
    const paramType = this.props.match.params.type

    const readOnly = !!paramType
    // $FlowFixMe: type from URL
    const value: ?ResourceType = readOnly ? paramType : stateType

    return { readOnly, value }
  }

  renderSelectType(value: ?ResourceType, readOnly: boolean) {
    let input
    if (readOnly && value) {
      input = (
        <span className="input">
          <T id={'type-' + String(value)} />
        </span>
      )
    } else {
      input = (
        <div className="select is-fullwidth is-disabled">
          <select
            name="type"
            onChange={this.onChangeType}
            value={value || undefined}
            readOnly={readOnly}
            required>
            <option value={undefined} />
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
      )
    }

    return field({
      labelId: 'resource-type',
      leftIcon: 'info',
      input,
    })
  }

  onChangeType = (e: SyntheticInputEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      // Cancelled
      this.setState({ error: null, resource: null })
      return
    }

    // $FlowFixMe I don't want to test all possible values here
    const type: ResourceType = e.target.value
    const resource = this.state.resource
      ? { ...this.state.resource, type }
      : { type, id: '' }

    this.setState({
      error: null,
      resource,
    })
  }

  renderForm(resource: ?ResourceNew, readOnly: boolean) {
    if (!resource) {
      return null
    }

    const fields = this.getFormFields(resource, readOnly)

    if (!fields) {
      return this.renderError('Type not implemented')
    }

    // Always prepend 'id' field
    fields.unshift({
      labelId: 'resource-id',
      leftIcon: 'key',
      input: (
        <input
          className="input"
          name="name"
          type="text"
          value={this.state.resource ? this.state.resource.id : null}
          onChange={this.onChangeId}
          readOnly={this.state.saving}
          required
        />
      ),
    })

    return <Fragment>{fields.map(opts => field(opts))}</Fragment>
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

  getFormFields(resource: ResourceNew, readOnly: boolean): ?(FieldParams[]) {
    switch (resource.type) {
      case 'article':
        return [this.getDocField(resource, false)]
      case 'map':
        return [this.getDocField(resource, false)]
      //case 'sound':
      //case 'definition':
      //case 'focus':
      //case 'image':
      //case 'video':
      default:
        return null
    }
  }

  getDocField(resource: ResourceNew, multiple: boolean) {
    // $FlowFixMe: 'input' is set just below
    const opts: FieldParams = { labelId: 'selected-file' }
    const { doc } = this.state

    if (doc) {
      opts.leftIcon = 'file'
      opts.input = (
        <input
          className="input"
          type="text"
          placeholder="type"
          value={`${doc.name} (#${doc.id})`}
          readOnly={true}
          required
        />
      )
      opts.action = {
        icon: 'remove',
        buttonType: 'danger',
        onClick: this.unselectFile,
      }
    } else {
      opts.input = this.renderPicker(resource.type)
    }

    return opts
  }

  onPick = async (doc: UploadDoc, accessToken: string) => {
    this.setState(({ resource }) => {
      const state = { doc, accessToken, resource }
      if (resource && !resource.id) {
        state.resource = { ...resource, id: this.guessResourceId(doc) }
      }
      return state
    })

    return {}
  }

  guessResourceId(doc: UploadDoc) {
    return doc.name.replace(/[-\s].*$/, '')
  }

  unselectFile = () => {
    this.setState({ doc: null })
  }

  renderPicker(type: ?ResourceType) {
    return (
      <DocPicker
        locale={this.props.locale}
        label="select-file"
        onPick={this.onPick}
        showPickerAfterUpload={false}
        mimeTypes={type ? mimeTypes[type] : []}
      />
    )
  }

  onChangeId = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      error: null,
      resource: { ...this.state.resource, id: e.target.value },
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
    return resource.type && resource.id
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
        id: resource.id,
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
