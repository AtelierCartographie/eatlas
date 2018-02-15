// @flow

import React, { Component } from 'react'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import cx from 'classnames'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'

import './ResourceForm.css'

import DocPicker from './DocPicker'
import Icon from './Icon'
import {
  RESOURCE_TYPES,
  MIME_TYPES,
  RESOURCE_STATUSES,
  LOCALES,
  STATUS_STYLE,
  LEXICON_ID,
} from '../constants'
import { getTopics, replaceResource, fetchResources } from '../actions'
import Spinner from './Spinner'
import { parseArticleDoc, parseLexiconDoc } from '../api'
import ObjectDebug from './ObjectDebug'

export type SaveCallback = (
  resource: ResourceNew | Resource,
  uploads: Upload[],
  accessToken: string,
) => Promise<*>

type GoogleDocs = { [string]: ?GoogleDoc }

type Props = ContextIntl & {
  locale: Locale,
  topics: { list: Topic[], loading: boolean },
  shouldLoadTopics: boolean,
  resources: { list: Resource[], fetched: boolean },
  // Own props
  mode: 'create' | 'edit',
  resource: ?Resource,
  onSubmit: SaveCallback,
  // Actions
  getTopics: Function,
  replaceResource: Function,
  fetchResources: Function,
}

type State = {
  docs: GoogleDocs,
  accessToken: ?string,
  resource: ?Resource,
  saved: boolean,
  saving: boolean,
  error: ?Error,
  removedDocs: string[],
  parsing: boolean,
  parsed: ?any,
  types: ResourceType[],
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

type SelectOptions = { label: string, value: any, buttonStyle?: string }[]

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
    docs: {},
    accessToken: null,
    saving: false,
    saved: false,
    error: null,
    removedDocs: [],
    parsing: false,
    parsed: null,
    ...this.stateFromProps(this.props),
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
        <ObjectDebug title="Parsed article" object={this.state.parsed} />
      </div>
    )
  }

  componentDidMount() {
    if (!this.props.resources.fetched) {
      this.props.fetchResources()
    }
    if (this.props.shouldLoadTopics) {
      this.props.getTopics()
    }
  }

  stateFromProps(props: Props): { types: ResourceType[], resource: ?Resource } {
    const types = props.resources
      ? props.resources.list.some(resource => resource.type === 'definition') &&
        props.mode === 'create'
        ? RESOURCE_TYPES.filter(type => type !== 'definition')
        : RESOURCE_TYPES
      : this.state.types
    let resource: ?Resource = props.resource
    if (resource && !types.includes(resource.type)) {
      // $FlowFixMe Resource type has been removed! Blank type
      resource = Object.assign({}, resource, { type: '' })
    }
    // Special case: lexicon id is hardcoded
    if (resource && resource.type === 'definition') {
      resource = Object.assign({}, resource, { id: LEXICON_ID })
    }
    return { types, resource }
  }

  componentWillReceiveProps(props: Props) {
    this.setState({
      docs: this.docsFromResource(props.resource),
      ...this.stateFromProps(props),
    })
  }

  renderError(message: any) {
    return (
      <div className="notification is-danger">
        <strong>
          <T id="error" />:
        </strong>
        {message}
      </div>
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
      optionsStyle = 'select',
      onChange,
      value,
      rows = 1,
      loading = false,
    }: {
      readOnly?: boolean,
      mandatory?: boolean,
      leftIcon?: string,
      rightIcon?: string,
      options?: SelectOptions,
      optionsStyle?: 'select' | 'buttons',
      onChange?: Function,
      value?: any,
      rows?: number,
      loading?: boolean,
    } = {},
  ): FieldParams {
    const props = {
      value: value || this.getAttrValue(attr),
      onChange: onChange || this.onChangeAttr(attr),
      readOnly: readOnly || loading,
      required: mandatory,
    }

    let input
    if (loading) {
      input = (
        <span className="input" disabled>
          <Spinner small />
        </span>
      )
    } else if (options) {
      if (optionsStyle === 'buttons') {
        input = (
          <div className="buttons has-addons">
            {options.map(({ label, value, buttonStyle }) => (
              <button
                key={value}
                className={cx(
                  'button',
                  buttonStyle ? 'is-' + buttonStyle : null,
                  {
                    'is-outlined has-text-weight-light': props.value !== value,
                    'has-text-weight-bold': props.value === value,
                  },
                )}
                value={value}
                onClick={props.onChange}
                disabled={props.readOnly}>
                {label}
              </button>
            ))}
          </div>
        )
      } else if (readOnly) {
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
  ): SelectOptions {
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
    // avoid null values to keep this input controlled
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
      options: this.buildSelectOptions(this.state.types, 'type-', true),
    })

    const idField = this.getAttrField('id', {
      leftIcon: 'key',
      mandatory: true,
      value: this.getAttrValue('id'),
      // lexicon: id is hardcoded
      readOnly:
        readOnly ||
        this.props.mode === 'edit' ||
        (resource ? resource.type === 'definition' : false),
    })

    if (!resource || !resource.type) {
      return [typeField].concat(resource && resource.id ? [idField] : [])
    }

    const prependFields = () => [
      typeField,
      idField,
      this.props.mode === 'edit' &&
        this.getAttrField('status', {
          mandatory: true,
          readOnly,
          options: this.buildSelectOptions(RESOURCE_STATUSES, 'status-').map(
            o => Object.assign(o, { buttonStyle: STATUS_STYLE[o.value] }),
          ),
          optionsStyle: 'buttons',
        }),
    ]

    const appendFields = ({ subtitle, copyright, optionalTopic }) => [
      this.getAttrField('title', {
        leftIcon: 'header',
        mandatory: true,
        readOnly,
        loading: this.state.parsing,
      }),
      subtitle &&
        this.getAttrField('subtitle', {
          leftIcon: 'header',
          readOnly,
          loading: this.state.parsing,
        }),
      this.getAttrField('topic', {
        leftIcon: 'paragraph',
        mandatory: !optionalTopic,
        readOnly,
        loading:
          this.state.parsing ||
          this.props.topics.loading ||
          this.props.shouldLoadTopics,
        options: (this.props.mode === 'create'
          ? [{ label: '', value: null }]
          : []
        ).concat(
          this.props.topics.list.map(({ name, id }) => ({
            label: name,
            value: id,
          })),
        ),
      }),
      this.getAttrField('language', {
        leftIcon: 'language',
        mandatory: true,
        readOnly,
        loading: this.state.parsing,
        options: this.buildSelectOptions(
          LOCALES,
          null,
          this.props.mode === 'create',
        ),
      }),
      this.getAttrField('description', {
        leftIcon: 'info',
        mandatory: true,
        readOnly,
        loading: this.state.parsing,
        rows: 5,
      }),
      copyright &&
        this.getAttrField('copyright', {
          leftIcon: 'copyright',
          readOnly,
        }),
    ]

    const buildFields = (
      fields: Array<FieldParams>,
      {
        subtitle = false,
        copyright = false,
        optionalTopic = false,
      }: { subtitle?: boolean, copyright?: boolean, optionalTopic?: boolean },
    ) =>
      prependFields()
        .concat(fields)
        .concat(appendFields({ subtitle, copyright, optionalTopic }))
        .filter(x => x)

    switch (resource.type) {
      case 'article':
        // $FlowFixMe: seriously flow, you yell at this one and not the next ones? I can't see the logic here, shut up
        return buildFields(
          [
            this.getDocField(resource, 'article', {
              mandatory: true,
              onPick: this.onPickArticle,
            }),
          ],
          { subtitle: true },
        )
      case 'map':
        return buildFields(
          [this.getDocField(resource, 'map', { mandatory: true })],
          { subtitle: true, copyright: true },
        )
      case 'image':
        return buildFields(
          // flatten
          Array.prototype.concat(
            ...['small', 'medium', 'large'].map(size => {
              return [1, 2, 3].map(d => {
                return this.getDocField(resource, `image-${size}-${d}x`, {
                  labelId: 'selected-image',
                  labelValues: { size, density: `${d}x` },
                  mandatory: size === 'medium' && d === 1,
                })
              })
            }),
          ),
          { copyright: true },
        )
      case 'video':
        return buildFields(
          [
            this.getAttrField('mediaUrl', {
              leftIcon: 'link',
              mandatory: true,
              readOnly,
              loading: this.state.parsing,
            }),
          ],
          { copyright: true },
        )
      case 'sound':
        return buildFields(
          [this.getDocField(resource, 'sound', { mandatory: true })],
          { subtitle: true, copyright: true },
        )
      case 'definition':
        return buildFields(
          [
            this.getDocField(resource, 'lexicon', {
              mandatory: true,
              onPick: this.onPickLexicon,
            }),
            ...this.getLexiconFields(),
          ],
          { subtitle: false, copyright: true, optionalTopic: true },
        )

      //case 'focus': // subtitle: true, copyright: false

      default:
        return [
          typeField,
          this.getAttrField('error', {
            leftIcon: 'exclamation-triangle',
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
      onPick = this.onPick(docKey),
    }: {
      multiple?: boolean,
      labelId?: string,
      labelValues?: Object,
      mandatory?: boolean,
      onPick?: Function,
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
          onPick={onPick}
          showPickerAfterUpload={false}
          mimeTypes={resource.type ? MIME_TYPES[resource.type] : []}
        />
      )
    }

    return opts
  }

  onPick = (docKey: string) => async (doc: GoogleDoc, accessToken: string) => {
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

  async parsePickedDoc(
    key: string,
    parse: (body: {
      uploads: Upload[],
      accessToken: string,
    }) => Promise<any>,
    getState: (
      state: State,
      parsed: any,
    ) => { parsed?: any, resource?: Resource },
    doc: GoogleDoc,
    accessToken: string,
  ) {
    this.onPick(key)(doc, accessToken)
    this.setState({ parsing: true, parsed: null, error: null })
    try {
      const parsed = await parse({
        uploads: [
          {
            fileId: doc.id,
            key,
            mimeType: doc.mimeType,
          },
        ],
        accessToken,
      })
      this.setState(state => ({ ...getState(state, parsed), parsing: false }))
    } catch (error) {
      this.setState(state => ({
        parsing: false,
        parsed: null,
        error,
        docs: { ...state.docs, article: null },
      }))
    }
  }

  onPickArticle = async (doc: GoogleDoc, accessToken: string) => {
    const postParse = (state, parsed) => {
      const getMetaText = type => {
        const meta = parsed.metas.find(m => m.type === type)
        return meta ? meta.text : null
      }
      // $FlowFixMe: temporarily partial resource now, but it'll be filled later
      const resource: Resource = { ...(state.resource || {}) }
      resource.id = getMetaText('id') || resource.id
      resource.title = getMetaText('title') || resource.title
      resource.subtitle = getMetaText('subtitle') || resource.subtitle
      resource.copyright = getMetaText('copyright') || resource.copyright
      resource.topic = getMetaText('topic') || resource.topic
      // language = first summary's language found
      const foundSummary: ?{ summary: string, lang: Locale } = LOCALES.reduce(
        (found, lang) => {
          if (found) {
            return found
          }
          const summary = getMetaText('summary-' + lang)
          if (summary) {
            return { summary, lang }
          }
          return null
        },
        null,
      )
      resource.language = foundSummary ? foundSummary.lang : ''
      resource.description = foundSummary ? foundSummary.summary : ''
      return { parsed, resource }
    }
    this.parsePickedDoc('article', parseArticleDoc, postParse, doc, accessToken)
  }

  onPickLexicon = async (doc: GoogleDoc, accessToken: string) => {
    const postParse = (state, parsed) => {
      const newState: { parsed: any, resource?: Resource } = { parsed }
      if (state.resource) {
        const resource: Resource = state.resource
        newState.resource = {
          ...resource,
          title:
            resource.title ||
            this.props.intl.formatMessage({ id: 'lexicon-title' }),
          language: resource.language || this.props.locale,
          description:
            resource.description ||
            this.props.intl.formatMessage(
              { id: 'lexicon-description' },
              { nb: parsed.definitions.length },
            ),
        }
      }
      return newState
    }
    this.parsePickedDoc('lexicon', parseLexiconDoc, postParse, doc, accessToken)
  }

  getLexiconFields(): FieldParams[] {
    const { parsed } = this.state
    if (!parsed) {
      return []
    }

    return [
      {
        labelId: 'nb-definitions',
        input: (
          <span className="input" disabled>
            {parsed.definitions.length}
          </span>
        ),
      },
    ]
  }

  guessResourceId(doc: GoogleDoc) {
    return doc.name.replace(/[-\s.].*$/, '')
  }

  unselectFile = (docKey: string) => e => {
    e.preventDefault()
    this.setState(state => ({
      docs: { ...state.docs, [docKey]: null },
      removedDocs: state.removedDocs.concat([docKey]),
    }))
  }

  // Cache generated callbacks to avoid useless re-renders
  onChangeAttr = (attr: string, clearDocs: boolean = false) => (
    e: SyntheticInputEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value // beware recycled synthetic events
    const additional =
      attr === 'type' && value === 'definition'
        ? { id: LEXICON_ID } // Special case: hardcoded id for lexicon
        : {}
    this.setState(state => ({
      error: null,
      resource: { ...state.resource, [attr]: value, ...additional },
      docs: clearDocs ? {} : state.docs,
      removedDocs: clearDocs ? [] : state.removedDocs,
    }))
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

    const { resource, docs, accessToken, removedDocs } = this.state

    if (!resource || !this.isSaveable()) {
      return
    }

    const uploads = Object.keys(docs)
      .filter(key => docs[key] && !!docs[key].id && !removedDocs.includes(key))
      .reduce((ups, key) => {
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
      .concat(
        // In 'edit' mode: we include deleted docs
        this.props.mode === 'edit'
          ? removedDocs.map(key => ({
              key,
              fileId: '', // Convention: empty fileId means deletion
              mimeType: '',
            }))
          : [],
      )

    this.props
      .onSubmit(resource, uploads, accessToken || '')
      .then((resource: Resource) => {
        this.props.replaceResource(resource)
        this.setState({
          resource: { ...this.state.resource, ...resource },
          docs: this.docsFromResource(resource),
          removedDocs: [],
        })
        toast.success(<T id="toast-resource-saved" />)
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
      case 'video':
      case 'sound':
        return true
      case 'definition':
        if (!docs.lexicon) {
          return false
        }
        break
      //case 'focus':
      default:
        return null
    }

    // All good!
    return true
  }

  docsFromResource(resource: ?Resource): GoogleDocs {
    const docs = {}

    if (!resource) {
      return docs
    }

    if (resource.type === 'image') {
      const images = resource.images
      for (let size in images) {
        for (let density in images[size]) {
          if (!images[size][density]) {
            continue // skip null documents (was deleted)
          }
          docs[`image-${size}-${density}`] = {
            type: 'photo',
            id: '', // No GoogleDoc id → will not be included in onSubmit's uploads
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
  ({ resources, locale, topics }: AppState) => ({
    locale, // used by DocPicker
    shouldLoadTopics: topics.list.length === 0,
    topics, // used by <select>
    resources,
  }),
  { getTopics, replaceResource, fetchResources },
)(injectIntl(ResourceForm))
