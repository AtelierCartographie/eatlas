// @flow

import React, { Component } from 'react'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import cx from 'classnames'
import { connect } from 'react-redux'

import './ResourceForm.css'

import DocPicker from './DocPicker'
import Icon from './Icon'
import {
  RESOURCE_TYPES,
  MIME_TYPES,
  RESOURCE_STATUSES,
  LOCALES,
} from '../constants'
import { getTopics } from '../actions'

export type SaveCallback = (
  resource: ResourceNew | Resource,
  docs: { [string]: ?UploadDoc },
  accessToken: string,
) => Promise<*>

type Props = ContextIntl & {
  locale: Locale,
  topics: { list: Topic[], loading: boolean },
  shouldLoadTopics: boolean,
  // Own props
  mode: 'create' | 'edit',
  resource: ?Resource,
  onSubmit: SaveCallback,
  // Actions
  getTopics: Function,
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

const renderField = ({
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
    // Convert resource files to docs (to make DocPicker aware in edit mode)
    docs: this.docsFromResource(),
    resource: this.props.resource,
    accessToken: null,
    saving: false,
    saved: false,
    error: null,
  }

  gapi: GoogleApi

  cached_onChangeAttr: { [string]: Function } = {}

  render() {
    const fields = this.getFormFields()

    return (
      <div className="ResourceForm">
        {this.state.error ? this.renderError(this.state.error.message) : null}
        <form onSubmit={this.onSubmit}>
          {fields.map(renderField)}
          {this.renderSave()}
        </form>
      </div>
    )
  }

  componentDidMount() {
    if (this.props.shouldLoadTopics) {
      this.props.getTopics()
    }
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

  getAttrField(
    attr: string,
    {
      readOnly = false,
      mandatory = false,
      leftIcon,
      rightIcon,
      options,
      onChange,
      value,
      rows = 1,
    }: {
      readOnly?: boolean,
      mandatory?: boolean,
      leftIcon?: string,
      rightIcon?: string,
      options?: { label: string, value: any }[],
      onChange?: Function,
      value?: any,
      rows?: number,
    } = {},
  ): FieldParams {
    const props = {
      value: value || this.getAttrValue(attr),
      onChange: onChange || this.onChangeAttr(attr),
      readOnly: readOnly,
      required: mandatory,
    }

    let input
    if (options) {
      if (readOnly) {
        const selected = options.find(({ value }) => value === props.value)
        const label = selected ? selected.label : String(props.value)
        input = <span className="input">{label}</span>
      } else {
        input = (
          <div className="select is-fullwidth">
            <select {...props}>
              {options.map(({ label, value }) => (
                <option value={value} key={String(value)}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )
      }
    } else if (rows > 1) {
      input = <textarea className="textarea" rows={rows} {...props} />
    } else {
      input = <input className="input" type="text" {...props} />
    }

    return {
      labelId: 'resource-' + attr,
      leftIcon,
      rightIcon,
      input,
      mandatory,
    }
  }

  buildSelectOptions(
    values: any[],
    intlPrefix: ?string,
    prependEmpty: boolean = false,
  ): { label: string, value: any }[] {
    return (prependEmpty ? [{ label: '', value: undefined }] : []).concat(
      values.map(v => ({
        label: intlPrefix
          ? this.props.intl.formatMessage({ id: intlPrefix + String(v) })
          : String(v),
        value: v,
      })),
    )
  }

  getAttrValue(attr: string): string {
    /* avoid null values to keep this input controlled */
    return this.state.resource && this.state.resource[attr]
      ? this.state.resource[attr]
      : ''
  }

  getFormFields(): FieldParams[] {
    const { resource, saving: readOnly } = this.state

    const typeField = this.getAttrField('type', {
      readOnly: readOnly,
      value:
        this.getAttrValue('type') ||
        (this.props.resource && this.props.resource.type),
      onChange: this.onChangeAttr('type', true),
      mandatory: true,
      options: this.buildSelectOptions(RESOURCE_TYPES, 'type-', true),
    })

    const idField = this.getAttrField('id', {
      leftIcon: 'key',
      mandatory: true,
      readOnly: readOnly || this.props.mode === 'edit',
    })

    if (!resource || !resource.type) {
      return [typeField].concat(resource && resource.id ? [idField] : [])
    }

    const prependFields = () =>
      [typeField, idField].concat(
        this.props.mode === 'edit'
          ? [
              this.getAttrField('status', {
                leftIcon: 'question-circle-o',
                mandatory: true,
                readOnly,
                options: this.buildSelectOptions(RESOURCE_STATUSES, 'status-'),
              }),
            ]
          : [],
      )

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
                  mandatory: false,
                }),
              ]
            : [],
        )
        .concat([
          this.getAttrField('topic', {
            leftIcon: 'paragraph',
            mandatory: true,
            readOnly:
              readOnly ||
              this.props.topics.loading ||
              this.props.shouldLoadTopics,
            ...(this.props.topics.loading || this.props.shouldLoadTopics
              ? { rightIcon: 'spinner fa-pulse' }
              : {
                  options: this.props.topics.list.map(({ name, id }) => ({
                    label: name,
                    value: id,
                  })),
                }),
          }),
          this.getAttrField('language', {
            leftIcon: 'language',
            mandatory: true,
            readOnly,
            options: this.buildSelectOptions(LOCALES),
          }),
          this.getAttrField('description', {
            leftIcon: 'info',
            mandatory: true,
            readOnly,
            rows: 5,
          }),
        ])
        .concat(
          copyright
            ? [
                this.getAttrField('copyright', {
                  leftIcon: 'copyright',
                  readOnly,
                  mandatory: false,
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
        return [
          typeField,
          this.getAttrField('error', {
            leftIcon: 'exclamation-triangle',
            mandatory: false,
            readOnly: true,
            value: 'Type not implemented',
          }),
        ]
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
  ): FieldParams {
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
          value={doc.name}
          readOnly={true}
          required
        />
      )
      opts.action = {
        icon: 'remove',
        buttonType: 'danger',
        onClick: this.unselectFile(docKey),
      }
    } else {
      opts.input = (
        <DocPicker
          locale={this.props.locale}
          label="select-file"
          onPick={this.onPick(docKey)}
          showPickerAfterUpload={false}
          mimeTypes={resource.type ? MIME_TYPES[resource.type] : []}
        />
      )
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

  unselectFile = (docKey: string) => e => {
    e.preventDefault()
    this.setState({ docs: { ...this.state.docs, [docKey]: null } })
  }

  // Cache generated callbacks to avoid useless re-renders
  onChangeAttr = (attr: string, clearDocs: boolean = false) => (
    e: SyntheticInputEvent<HTMLInputElement>,
  ) =>
    this.setState({
      error: null,
      resource: { ...this.state.resource, [attr]: e.target.value },
      docs: clearDocs ? {} : this.state.docs,
    })

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
      .then((resource: Resource) => {
        this.setState({ resource: { ...this.state.resource, ...resource } })
      })
      .catch(error => {
        this.setState({ error })
      })
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

  docsFromResource(): { [string]: ?UploadDoc } {
    const { resource } = this.props
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

export default connect(
  ({ locale, topics }: AppState) => ({
    locale,
    shouldLoadTopics: topics.list.length === 0,
    topics,
  }),
  { getTopics },
)(injectIntl(ResourceForm))
