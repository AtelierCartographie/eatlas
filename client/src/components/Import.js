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
  docs: { [string]: ?UploadDoc },
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
  mandatory?: boolean,
}

const field = ({
  labelId,
  labelValues,
  leftIcon,
  rightIcon,
  input,
  action,
  key,
  mandatory,
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
        {mandatory ? <Icon icon="asterisk" /> : null}
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
    docs: {},
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
      mandatory: true,
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
          readOnly={readOnly}
          required
        />
      ),
      mandatory: true,
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
        return [this.getDocField(resource, 'article', { mandatory: true })]
      case 'map':
        return [this.getDocField(resource, 'map', { mandatory: true })]
      case 'image':
        return [
          this.getDocField(resource, 'image-small-1x', {
            labelId: 'selected-image',
            labelValues: { size: 'small', density: '1x' },
          }),
          this.getDocField(resource, 'image-small-2x', {
            labelId: 'selected-image',
            labelValues: { size: 'small', density: '2x' },
          }),
          this.getDocField(resource, 'image-small-3x', {
            labelId: 'selected-image',
            labelValues: { size: 'small', density: '3x' },
          }),
          this.getDocField(resource, 'image-medium-1x', {
            labelId: 'selected-image',
            labelValues: { size: 'medium', density: '1x' },
            mandatory: true,
          }),
          this.getDocField(resource, 'image-medium-2x', {
            labelId: 'selected-image',
            labelValues: { size: 'medium', density: '2x' },
          }),
          this.getDocField(resource, 'image-medium-3x', {
            labelId: 'selected-image',
            labelValues: { size: 'medium', density: '3x' },
          }),
          this.getDocField(resource, 'image-large-1x', {
            labelId: 'selected-image',
            labelValues: { size: 'large', density: '1x' },
          }),
          this.getDocField(resource, 'image-large-2x', {
            labelId: 'selected-image',
            labelValues: { size: 'large', density: '2x' },
          }),
          this.getDocField(resource, 'image-large-3x', {
            labelId: 'selected-image',
            labelValues: { size: 'large', density: '3x' },
          }),
        ]
      //case 'sound':
      //case 'definition':
      //case 'focus':
      //case 'video':
      default:
        return null
    }
  }

  getDocField(
    resource: ResourceNew,
    docKey: string,
    {
      multiple = false,
      labelId = 'selected-file',
      labelValues = {},
      mandatory = false,
    }: {
      multiple?: boolean,
      labelId?: string,
      labelValues?: Object,
      mandatory?: boolean,
    } = {},
  ) {
    // $FlowFixMe: 'input' is set just below
    const opts: FieldParams = { labelId, labelValues, mandatory, key: docKey }
    const doc = this.state.docs[docKey]

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
      opts.input = this.renderPicker(resource.type, docKey)
    }

    return opts
  }

  onPick = (docKey: string) => async (doc: UploadDoc, accessToken: string) => {
    this.setState(({ resource, docs }) => {
      const state = { docs: { ...docs, [docKey]: doc }, accessToken, resource }
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

  unselectFile = (docKey: string) => {
    this.setState({ docs: { ...this.state.docs, [docKey]: null } })
  }

  renderPicker(type: ?ResourceType, docKey: string) {
    return (
      <DocPicker
        locale={this.props.locale}
        label="select-file"
        onPick={this.onPick(docKey)}
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
    if (!this.state.resource) {
      return null
    }

    return (
      <button
        className={cx('button is-primary', {
          'is-loading': this.state.saving,
        })}
        disabled={!this.isSaveable()}>
        <Icon icon="check" />
        <span>
          <T id="save-changes" />
        </span>
      </button>
    )
  }

  onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { resource, docs, accessToken } = this.state

    if (!resource || !this.isSaveable()) {
      return
    }

    // TODO Redux (this is important to update store and make redirection actually work)
    this.setState({ saving: true, error: null })
    try {
      const uploads = Object.keys(docs).reduce((ups, key) => {
        const doc = docs[key]
        return doc
          ? ups.concat([
              {
                key,
                fileId: doc.id,
                mimeType: doc.mimeType,
              },
            ])
          : ups
      }, [])
      const { id } = await addResourceFromGoogleDrive({
        id: resource.id,
        type: resource.type,
        uploads,
        accessToken,
      })
      this.setState({ saving: false, error: null })
      this.props.history.push(`/resources/${id}/edit`)
    } catch (error) {
      this.setState({ saving: false, error })
    }
  }

  // TODO implement more complex validations here?
  // Will probably depend on resource type
  isSaveable() {
    const { resource, docs } = this.state

    // Common mandatory fields
    if (!resource) {
      return false
    }
    if (!resource.type || !resource.id) {
      return false
    }

    // Type-specific validation
    switch (resource.type) {
      case 'article':
        if (!docs.article) {
          return false
        }
        break
      case 'map':
        if (!docs.map) {
          return false
        }
        break
      case 'image':
        // Mandatory sizes
        if (!docs['image-medium-1x']) {
          return false
        }
        break
      //case 'sound':
      //case 'definition':
      //case 'focus':
      //case 'video':
      default:
        return null
    }

    // All good!
    return true
  }
}

export default withRouter(connect(({ locale }) => ({ locale }))(Import))
