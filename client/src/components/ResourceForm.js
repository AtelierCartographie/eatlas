// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T } from 'react-intl'
import cx from 'classnames'
import { connect } from 'react-redux'

import DocPicker from './DocPicker'
import Icon from './Icon'

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

export type SaveCallback = (
  resource: ResourceNew | Resource,
  docs: { [string]: ?UploadDoc },
  accessToken: string,
) => Promise<*>

type Props = {
  locale: Locale,
  // Own props
  resource: ?Resource,
  onSubmit: SaveCallback,
}

type State = {
  docs: { [string]: ?UploadDoc },
  accessToken: ?string,
  resource: ?Resource,
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
    <div className="field is-horizontal" key={key || labelId}>
      <div className="field-label is-normal">
        <label className={cx('label', { 'has-text-grey-light': !mandatory })}>
          <T id={labelId} values={labelValues} />
          {mandatory ? <Icon icon="asterisk" /> : null}
        </label>
      </div>
      <div className="field-body">
        <div className={cx('field', { 'has-addons': action })}>
          <div className={ctrlClass}>
            {input}
            {$leftIcon}
            {$rightIcon}
          </div>
          {$action}
        </div>
      </div>
    </div>
  )
}

class ResourceForm extends Component<Props, State> {
  state: State = {
    docs: this.docsFromResource(this.props.resource),
    resource: this.props.resource,
    accessToken: null,
    saving: false,
    saved: false,
    error: null,
  }

  gapi: GoogleApi

  cached_onChangeResourceAttribute: { [string]: Function } = {}

  render() {
    const { value: type, readOnly } = this.getType()

    return (
      <div className="ResourceForm">
        {this.state.error ? this.renderError(this.state.error.message) : null}
        <form onSubmit={this.onSubmit}>
          {this.renderSelectType(type, readOnly || this.state.saving)}
          {this.renderForm(this.state.resource, this.state.saving)}
          {this.renderSave()}
        </form>
      </div>
    )
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

  getType(): { readOnly: boolean, value: ?ResourceType } {
    const stateType = this.state.resource && this.state.resource.type
    const paramType = this.props.resource && this.props.resource.type

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
      this.setState({ error: null, resource: null, docs: {} })
      return
    }

    // $FlowFixMe I don't want to test all possible values here
    const type: ResourceType = e.target.value
    const resource = this.state.resource
      ? { ...this.state.resource, type }
      : { ...this.props.resource, type }

    this.setState({
      error: null,
      resource,
      docs: {},
    })
  }

  renderForm(resource: ?ResourceNew, readOnly: boolean) {
    if (!resource || !resource.type) {
      return null
    }

    const fields = this.getFormFields(resource, readOnly)

    if (!fields) {
      return this.renderError('Type not implemented')
    }

    return <Fragment>{fields.map(opts => field(opts))}</Fragment>
  }

  getAttrField(
    attr: string,
    {
      readOnly = false,
      mandatory = false,
      type = 'text',
      leftIcon,
      rightIcon,
    }: {
      readOnly?: boolean,
      mandatory?: boolean,
      type?: string,
      leftIcon?: string,
      rightIcon?: string,
    } = {},
  ): FieldParams {
    return {
      labelId: 'resource-' + attr,
      leftIcon,
      rightIcon,
      input: (
        <input
          className="input"
          type={type}
          value={
            /* avoid null values to keep this input controlled */
            this.state.resource && this.state.resource[attr]
              ? this.state.resource[attr]
              : ''
          }
          onChange={this.onChangeResourceAttribute(attr)}
          readOnly={readOnly}
          required={mandatory}
        />
      ),
      mandatory,
    }
  }

  getFormFields(resource: ResourceNew, readOnly: boolean): ?(FieldParams[]) {
    const prependFields = () => [
      this.getAttrField('id', {
        leftIcon: 'key',
        mandatory: true,
        readOnly,
      }),
    ]

    const appendFields = ({ subtitle, copyright }) =>
      [
        this.getAttrField('title', {
          leftIcon: 'header',
          mandatory: true,
          readOnly,
        }),
      ]
        .concat(
          subtitle
            ? [
                this.getAttrField('subtitle', {
                  leftIcon: 'header',
                  readOnly,
                }),
              ]
            : [],
        )
        .concat([
          this.getAttrField('topic', {
            leftIcon: 'paragraph',
            mandatory: true,
            readOnly,
          }),
          this.getAttrField('language', {
            // TODO select
            leftIcon: 'language',
            mandatory: true,
            readOnly,
          }),
          this.getAttrField('description', {
            // TODO select
            leftIcon: 'info',
            mandatory: true,
            readOnly,
          }),
        ])
        .concat(
          copyright
            ? [
                this.getAttrField('copyright', {
                  // TODO textarea
                  leftIcon: 'copyright',
                  readOnly,
                }),
              ]
            : [],
        )

    const buildFields = (
      fields: Array<FieldParams>,
      {
        subtitle = false,
        copyright = false,
      }: { subtitle?: boolean, copyright?: boolean },
    ) =>
      prependFields()
        .concat(fields)
        .concat(appendFields({ subtitle, copyright }))

    switch (resource.type) {
      case 'article':
        return buildFields(
          [this.getDocField(resource, 'article', { mandatory: true })],
          { subtitle: true },
        )
      case 'map':
        return buildFields(
          [this.getDocField(resource, 'map', { mandatory: true })],
          { subtitle: true, copyright: true },
        )
      case 'image':
        return buildFields(
          [
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
          ],
          { copyright: true },
        )

      //case 'sound': // subtitle: false, copyright: true
      //case 'definition': // subtitle: false, copyright: true
      //case 'focus': // subtitle: true, copyright: false
      //case 'video': // subtitle: false, copyright: true

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
          value={`${doc.name}${doc.id ? ` (#${doc.id})` : ''}`}
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
    this.setState(state => {
      const newState = {
        ...state,
        accessToken,
        resource: state.resource,
      }
      // Inject doc
      newState.docs = { ...state.docs, [docKey]: doc }
      // Guess resource id
      if (state.resource && !state.resource.id) {
        const newResource = { ...state.resource }
        newResource.id =
          this.props.resource && this.props.resource.id
            ? this.props.resource.id
            : this.guessResourceId(doc)
        newState.resource = newResource
      }
      return newState
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

  // Cache generated callbacks to avoid useless re-renders
  onChangeResourceAttribute = (attr: string) => {
    if (this.cached_onChangeResourceAttribute[attr]) {
      return this.cached_onChangeResourceAttribute[attr]
    }

    return (this.cached_onChangeResourceAttribute[attr] = (
      e: SyntheticInputEvent<HTMLInputElement>,
    ) => {
      this.setState({
        error: null,
        resource: { ...this.state.resource, [attr]: e.target.value },
      })
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

  onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { resource, docs, accessToken } = this.state

    if (!resource || !this.isSaveable()) {
      return
    }

    this.props
      .onSubmit(resource, docs, accessToken || '')
      .then((resource: Resource) =>
        this.setState({ resource: { ...this.state.resource, ...resource } }),
      )
      .catch(error => this.setState({ error }))
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

  // Convert resource files to docs (to make DocPicker aware)
  componentWillReceiveProps(nextProps) {
    console.log(nextProps.resource)
    if (nextProps.resource !== this.props.resource) {
      this.setState({
        docs: this.docsFromResource(nextProps.resource),
        resource: nextProps.resource,
      })
    }
  }

  docsFromResource(resource: ?Resource): { [string]: ?UploadDoc } {
    const docs = {}

    if (!resource) {
      return docs
    }

    if (resource.type === 'image') {
      const images = resource.images
      for (let size in images) {
        for (let density in images[size]) {
          docs[`image-${size}-${density}`] = {
            type: 'photo',
            id: '',
            mimeType: '',
            name: images[size][density],
          }
        }
      }
    }

    return docs
  }
}

export default connect(({ locale }) => ({
  locale,
}))(ResourceForm)
