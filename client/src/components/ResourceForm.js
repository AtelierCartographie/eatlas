// @flow

import React, { Component, Fragment } from 'react'
import { FormattedMessage as T, injectIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import cx from 'classnames'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'
import { slugify, stripTags, topicName } from '../universal-utils'

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
  LEXICON_ID_PREFIX,
} from '../constants'
import { getTopics, replaceResource, fetchResources } from '../actions'
import Spinner from './Spinner'
import {
  parseArticleDoc,
  parseFocusDoc,
  parseLexiconDoc,
  getResourceUrls,
} from '../api'
import ObjectDebug from './ObjectDebug'
import {
  canUnpublish,
  guessResourceType,
  guessResourceLanguage,
} from '../utils'
import AsyncData from './AsyncData'
import Editor from './WysiwygEditor'
import Flag from './Flag'

const RE_ID_LANG_SUFFIX = new RegExp(`-(${LOCALES.join('|')})$`, 'i')
const RE_RESOURCE_ID = new RegExp(
  `^([^-\\s]+(?:-(?:${LOCALES.join('|')}))?)[-\\s.].*$`,
  'i',
)

const API_SERVER = process.env.REACT_APP_API_SERVER || ''

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
  renderBeforeForm?: ?Function,
  renderAfterForm?: ?Function,
  renderEndForm?: ?Function,
  publishable: boolean,
  whyUnpublishable: string[],
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
  help?: React$Element<any>,
}

type SelectOptions = {
  label: string,
  value: any,
  buttonStyle?: string,
  disabled?: boolean,
  disabledReason?: string,
}[]

const renderField = ({
  labelId,
  labelValues,
  leftIcon,
  rightIcon,
  input,
  action,
  key,
  mandatory,
  help,
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
          <T id={`bo.${labelId}`} values={labelValues} />
          {mandatory ? <Icon icon="asterisk" /> : null}
        </label>
      </div>
      <div className="field-body">
        <div className={cx('field', { 'has-addons': action })}>
          <div className={ctrlClass}>
            {input}
            {help ? <p className="help">{help}</p> : null}
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
    docs: this.docsFromResource(this.props.resource),
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
    return (
      <div className="ResourceForm">
        {this.state.error ? this.renderError(this.state.error.message) : null}
        {this.props.renderBeforeForm ? this.props.renderBeforeForm() : null}
        <form onSubmit={this.onSubmit}>
          {this.getFormFields().map(renderField)}
          {this.props.renderEndForm ? this.props.renderEndForm() : null}
          {this.renderSave()}
        </form>
        {this.props.renderAfterForm ? this.props.renderAfterForm() : null}
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
    // Type 'definition' can be selected only in two situations:
    // - I'm editing the lexicon
    // - I'm creating a resource and there is no other lexicon
    let types = this.state ? this.state.types : []
    if (props.resources) {
      const isLexiconEdited =
        props.resource && props.resource.type === 'definition'
      const isFoundLexicon = props.resources.list.some(
        resource => resource.type === 'definition',
      )
      if (isLexiconEdited || (props.mode === 'create' && !isFoundLexicon)) {
        types = RESOURCE_TYPES
      } else {
        types = RESOURCE_TYPES.filter(type => type !== 'definition')
      }
    }
    let resource: ?Resource = Object.assign({}, props.resource)

    // Special case: creating a lexicon
    if (
      resource &&
      resource.type === 'definition' &&
      this.props.mode === 'create'
    ) {
      let guessedLanguage = null
      // Invalid id? Remove
      if (resource.id) {
        guessedLanguage = guessResourceLanguage(resource)
        const validSyntax =
          resource.id.indexOf(LEXICON_ID_PREFIX) === 0 &&
          guessedLanguage !== null
        const consistentLanguage =
          !resource.language || guessedLanguage === resource.language
        if (!validSyntax || !consistentLanguage) {
          delete resource.id
        }
      }
      // Build id from language…
      if (!resource.id && resource.language) {
        resource.id = LEXICON_ID(resource.language)
      }
      // …or guess language from ID
      if (!resource.language && resource.id) {
        resource.language = guessResourceLanguage(resource)
      }
      // At this point we MUST have consistent id and language (or both empty)
      const existingLexicons = props.resources.list.filter(
        r => r.type === 'definition',
      )
      const missingLangs = LOCALES.filter(
        lang => !existingLexicons.some(r => r.language === lang),
      )
      if (missingLangs.length === 0) {
        // TODO warning?
      } else if (!resource.id && !resource.language) {
        // Use first found missing lexicon
        resource.language = missingLangs[0]
        resource.id = LEXICON_ID(resource.language)
      }
    }

    // Check for existing id when provided (can happen when reloading a page)
    if (
      props.mode === 'create' &&
      resource &&
      resource.id &&
      props.resources.list.find(r => r.id === resource.id)
    ) {
      if (resource.type === 'definition') {
        resource.id = LEXICON_ID(resource.language)
      } else {
        delete resource.id
      }
    }

    // Invalid resource type? Guess
    if (resource && !types.includes(resource.type)) {
      const type: ?ResourceType = guessResourceType(resource)
      // $FlowFixMe We allow empty type temporarily
      resource.type = type || ''
    }

    // Guess language from ID (suffix)
    if (resource && !resource.language) {
      resource.language = guessResourceLanguage(resource)
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
          <T id="bo.error" />:
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
      type = 'text',
      help,
      labelId = null,
      key = labelId,
      labelValues = {},
      rich = false,
      editorOptions = {},
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
      type?: string,
      help?: React$Element<any>,
      labelId?: string,
      key?: string,
      labelValues?: any,
      rich?: boolean,
      editorOptions?: any,
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
            {options.map(
              ({ label, value, buttonStyle, disabled, disabledReason }) => (
                <button
                  key={value}
                  className={cx(
                    'button',
                    buttonStyle ? 'is-' + buttonStyle : null,
                    {
                      'is-outlined has-text-weight-light':
                        props.value !== value,
                      'has-text-weight-bold': props.value === value,
                    },
                  )}
                  value={value}
                  onClick={props.onChange}
                  disabled={disabled || props.readOnly}
                  title={disabled ? disabledReason : ''}>
                  {label}
                </button>
              ),
            )}
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
    } else if (rich) {
      input = (
        <Editor
          {...props}
          {...editorOptions}
          rows={rows}
          key={this.state.resource.id}
        />
      )
    } else if (rows > 1) {
      input = <textarea className="textarea" {...props} rows={rows} />
    } else {
      input = <input className="input" type={type} {...props} />
    }

    return {
      labelId: labelId || 'resource-' + attr,
      key: key || labelId || 'key-' + attr,
      labelValues,
      leftIcon: rich ? null : leftIcon,
      rightIcon,
      input,
      mandatory,
      help,
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
      readOnly: readOnly || this.props.mode === 'edit',
      value:
        this.getAttrValue('type') ||
        (this.props.resource && this.props.resource.type),
      onChange: this.onChangeAttr('type', true),
      mandatory: true,
      options: this.buildSelectOptions(this.state.types, 'bo.type-', true),
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

    if (!resource || !resource.type)
      return [typeField].concat(resource && resource.id ? [idField] : [])

    const isArticle = resource.type === 'article' || resource.type === 'focus'

    const disabledStatusOption = ({ value }) => {
      if (value === 'published') {
        if (!this.props.publishable) {
          return {
            disabled: true,
            disabledReason: this.props.whyUnpublishable
              .map(text => this.props.intl.formatMessage({ id: text }))
              .join(', '),
          }
        }
      }
      if (value !== 'published' && resource.status === 'published') {
        if (!canUnpublish(resource, this.props.resources.list)) {
          return {
            disabled: true,
            disabledReason: this.props.intl.formatMessage({
              id: 'bo.cannot-delete-linked-resource',
            }),
          }
        }
      }
      return { disabled: false }
    }

    const prependFields = () => [
      typeField,
      idField,
      this.props.mode === 'edit' &&
        this.getAttrField('status', {
          mandatory: true,
          readOnly: resource.type === 'definition',
          options: this.buildSelectOptions(RESOURCE_STATUSES, 'bo.status-').map(
            o =>
              Object.assign(o, {
                buttonStyle: STATUS_STYLE[o.value],
                ...disabledStatusOption(o),
              }),
          ),
          optionsStyle: 'buttons',
        }),
      resource.status === 'published' && this.getUrlsField(resource),
    ]

    const appendFields = ({
      subtitle,
      titlePosition,
      copyright,
      topic,
      transcript,
      source,
    }) => [
      this.getAttrField('author', {
        leftIcon: 'user',
        mandatory: isArticle,
        readOnly:
          readOnly ||
          Boolean(isArticle && this.state.parsed && this.state.parsed.author),
        loading: this.state.parsing,
      }),
      this.getAttrField('title', {
        leftIcon: 'header',
        mandatory: true,
        readOnly:
          readOnly ||
          Boolean(isArticle && this.state.parsed && this.state.parsed.title),
        loading: this.state.parsing,
        rich: true,
        editorOptions: { singleLine: true },
      }),
      titlePosition &&
        this.getAttrField('titlePosition', {
          leftIcon: 'arrows-v',
          mandatory: true,
          options: this.buildSelectOptions(
            ['center', 'top', 'bottom'],
            'bo.position-',
            false,
          ),
        }),
      subtitle &&
        this.getAttrField('subtitle', {
          leftIcon: 'header',
          readOnly:
            readOnly ||
            Boolean(
              isArticle && this.state.parsed && this.state.parsed.subtitle,
            ),
          loading: this.state.parsing,
          rich: true,
          editorOptions: { singleLine: true },
        }),
      topic &&
        this.getAttrField('topic', {
          leftIcon: 'paragraph',
          mandatory: true,
          readOnly:
            readOnly ||
            Boolean(isArticle && this.state.parsed && this.state.parsed.topic),
          loading:
            this.state.parsing ||
            this.props.topics.loading ||
            this.props.shouldLoadTopics,
          options: (this.props.mode === 'create'
            ? [{ label: '', value: null }]
            : []
          ).concat(
            this.props.topics.list.map(topic => ({
              label: `${topic.id} - ${topicName(topic, this.props.locale)}`,
              value: topic.id,
            })),
          ),
        }),
      this.getAttrField('language', {
        leftIcon: 'language',
        mandatory: true,
        readOnly:
          readOnly ||
          Boolean(isArticle && this.state.parsed && this.state.parsed.language),
        loading: this.state.parsing,
        options: this.buildSelectOptions(
          this.state.resource.type === 'definition'
            ? // Lexicon: only allow not already uploaded languages
              this.props.resources.fetched
              ? LOCALES.filter(
                  lang =>
                    !this.props.resources.list.some(
                      r => r.type === 'definition' && r.language === lang,
                    ),
                )
              : [] // Unable to decide? no choice
            : LOCALES,
          null,
          this.props.mode === 'create' &&
            this.state.resource.type !== 'definition',
        ),
        onChange: this.onChangeLanguage,
      }),
      this.props.mode === 'edit' && this.getTranslationsField(resource),
      this.getAttrField('description_fr', {
        labelId: 'resource-description',
        key: 'resource-description-fr',
        labelValues: { lang: 'fr' },
        readOnly:
          readOnly ||
          Boolean(
            isArticle && this.state.parsed && this.state.parsed.description_fr,
          ),
        loading: this.state.parsing,
        rows: 5,
        rich: true,
      }),
      resource.type === 'article' &&
        this.getAttrField('description_en', {
          labelId: 'resource-description',
          key: 'resource-description-en',
          labelValues: { lang: 'en' },
          readOnly:
            readOnly ||
            Boolean(
              isArticle &&
                this.state.parsed &&
                this.state.parsed.description_en,
            ),
          loading: this.state.parsing,
          rows: 5,
          rich: true,
        }),
      transcript &&
        this.getAttrField('transcript', {
          rows: 5,
          rich: true,
        }),
      source &&
        this.getAttrField('source', {
          rows: 5,
          rich: true,
        }),
      copyright &&
        this.getAttrField('copyright', {
          rows: 5,
          rich: true,
          readOnly:
            readOnly ||
            Boolean(
              isArticle && this.state.parsed && this.state.parsed.copyright,
            ),
        }),
      this.getAttrField('updatedBy', {
        leftIcon: 'user',
        mandatory: false,
        readOnly: true,
      }),
      this.getAttrField('visiblePublishedAt', {
        leftIcon: 'calendar',
        mandatory: false,
        readOnly: false,
        type: 'date',
        help: (
          <T
            id="bo.resource-visiblePublishedAt-help"
            values={{
              publishedAt: new Date(
                resource.publishedAt || Date.now(),
              ).toLocaleDateString(this.props.locale),
            }}
          />
        ),
      }),
    ]

    const buildFields = (
      fields: Array<FieldParams>,
      {
        subtitle = false,
        titlePosition = false,
        copyright = false,
        topic = true, // lexicon
        transcript = false,
        source = false,
      }: {
        subtitle?: boolean,
        titlePosition?: boolean,
        copyright?: boolean,
        topic?: boolean,
        transcript?: boolean,
        source?: boolean,
      },
    ): FieldParams[] =>
      // $FlowFixMe: the filter(x => x) takes care of weeding out the non FieldParams
      prependFields()
        .concat(fields)
        .concat(
          appendFields({
            subtitle,
            titlePosition,
            copyright,
            topic,
            transcript,
            source,
          }),
        )
        .filter(x => x)

    switch (resource.type) {
      // Note: article is read-only, you have to re-upload
      case 'article':
        return buildFields(
          [
            this.getDocField(resource, 'article', {
              mandatory: true,
              onPick: this.onPickArticle,
            }),
          ],
          { subtitle: true, titlePosition: true },
        )
      case 'focus': // subtitle: true, copyright: false
        return buildFields(
          [
            this.getDocField(resource, 'focus', {
              mandatory: true,
              onPick: this.onPickFocus,
            }),
          ],
          { subtitle: true, copyright: false },
        )
      case 'map':
        return buildFields(
          [
            this.getResponsiveImageField(
              resource,
              ['small', 'medium', 'large'],
              ['1x', '2x', '3x'],
            ),
          ],
          {
            subtitle: true,
            copyright: true,
            source: true,
          },
        )
      case 'image':
        return buildFields(
          [
            this.getResponsiveImageField(
              resource,
              ['small', 'medium', 'large'],
              ['1x', '2x', '3x'],
            ),
          ],
          {
            copyright: true,
            source: true,
          },
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
          { copyright: true, transcript: true },
        )
      case 'sound':
        return buildFields(
          [this.getDocField(resource, 'sound', { mandatory: true })],
          { subtitle: true, copyright: true, transcript: true },
        )
      // Note: lexicon is read-only, you have to re-upload
      case 'definition':
        return buildFields(
          [
            this.getDocField(resource, 'lexicon', {
              mandatory: true,
              onPick: this.onPickLexicon,
            }),
            ...this.getLexiconFields(),
          ],
          { copyright: true, topic: false },
        )
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

  getUrlsField(resource): FieldParams | null {
    if (resource.status !== 'published') return null

    return {
      labelId: 'resource-uris',
      input: (
        <AsyncData
          key={resource.id}
          promise={getResourceUrls(resource.id)}
          render={links => (
            <ul>
              {links.map(url => (
                <li key={url}>
                  <a href={url}>{url}</a>
                </li>
              ))}
            </ul>
          )}
        />
      ),
      help: <T id="bo.resource-uris-help" />,
    }
  }

  getTranslationsField(resource): FieldParams | null {
    if (!this.props.resources.fetched) return null
    if (!resource.id) return null

    const idPrefix = resource.id.replace(RE_ID_LANG_SUFFIX, '')
    const translations = LOCALES.filter(lang => lang !== resource.language).map(
      lang => {
        const fullId = `${idPrefix}-${lang.toUpperCase()}`
        // Accept fallback to simple ID without suffix when it's FR
        const found =
          this.props.resources.list.find(r => r.id === fullId) ||
          (lang === 'fr'
            ? this.props.resources.list.find(r => r.id === idPrefix)
            : null)
        return { lang, found, id: found ? found.id : fullId }
      },
    )
    //: { list: Resource[], fetched: boolean },
    return {
      labelId: 'resource-translations',
      input: (
        <ul>
          {translations.map(({ lang, found, id }) => (
            <li key={lang}>
              <Flag lang={lang} />
              {found ? (
                <Link to={`/resources/${id}/edit`}>
                  {stripTags(found.title)}
                </Link>
              ) : (
                <Link to={`/resources/new/?${id}`}>
                  <T id="bo.article-related-create" values={{ title: id }} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ),
    }
  }

  getResponsiveImageField(
    resource,
    supportedSizes,
    supportedDensities,
  ): FieldParams {
    const re = resource.type === 'map' ? /^map-/ : /^image-/
    const { docs } = this.state
    const keys = Object.keys(docs)
      .filter(key => docs[key] && key.match(re))
      .sort()

    return {
      labelId: 'resource-image',
      input: (
        <Fragment>
          <DocPicker
            search={this.state.resource && this.state.resource.id}
            locale={this.props.locale}
            label="select-images"
            onPick={this.onPickResponsiveImage(
              resource,
              supportedSizes,
              supportedDensities,
            )}
            showPickerAfterUpload={true}
            multiple={true}
            mimeTypes={resource.type ? MIME_TYPES[resource.type] : []}
          />
          {keys.length > 0 && (
            <Fragment>
              <p className="help">
                <T id="bo.resource-image-help" />
              </p>
              <div className="columns thumbnails">
                {keys.map(key => {
                  const [, size, density] = key.split('-')
                  return (
                    <figure key={key} onClick={this.unselectFile(key)}>
                      <img
                        src={this.getThumbUrl(resource, docs, key)}
                        alt={docs[key] && docs[key].name}
                      />
                      <figcaption>
                        {size}@{density}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </Fragment>
          )}
        </Fragment>
      ),
      mandatory: true,
    }
  }

  getThumbUrl = (resource, docs, key) =>
    docs && docs[key]
      ? docs[key].id
        ? // Freshly picked document (we're editing or creating)
          `https://drive.google.com/thumbnail?id=${docs[key].id}&sz=w100-h100`
        : // Saved document (we're editing)
          `${API_SERVER}/resources/${resource.id}/file/${key}`
      : null

  onPickResponsiveImage = (resource, supportedSizes, supportedDensities) => {
    // name: <id>-<size>[@<density>] => key = image-<size>-<density>
    const key = resource.type // 'image' or 'map'
    const re =
      supportedSizes.length === 1 // only 1 size = size is optional in name
        ? new RegExp(
            `(?:-(${supportedSizes[0]}))?(?:@(${supportedDensities.join(
              '|',
            )}))?\\.[.a-z]+$`,
          )
        : new RegExp(
            `-(${supportedSizes.join('|')})(?:@(${supportedDensities.join(
              '|',
            )}))?\\.[.a-z]+$`,
          )
    return async (docs: GoogleDoc[], accessToken: string) => {
      docs.forEach(doc => {
        const match = doc.name.match(re)
        if (!match)
          return toast.error(
            <T id="bo.error-parsing-image-name" values={doc} />,
          )

        const [, size = supportedSizes[0], density = '1x'] = match
        this.onPick(`${key}-${size}-${density}`)([doc], accessToken)
      })
      return {}
    }
  }

  clearResponsiveImageDocs = resource => () => {}

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
          search={this.state.resource && this.state.resource.id}
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

  onPick = (docKey: string) => async (
    docs: GoogleDoc[],
    accessToken: string,
  ) => {
    const doc = docs[0]
    this.setState(state => {
      const newState = {
        ...state,
        accessToken,
        resource: state.resource,
      }
      // Inject doc ("undelete" if previously unpicked)
      newState.docs = { ...state.docs, [docKey]: doc }
      newState.removedDocs = state.removedDocs.filter(k => k !== docKey)
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
    this.onPick(key)([doc], accessToken)
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

  onPickArticleOrFocus = (key: string) => async (
    docs: GoogleDoc[],
    accessToken: string,
  ) => {
    const doc = docs[0]
    const postParse = (state, parsed) => {
      const getMetaText = type => {
        const meta = parsed.metas.find(m => m.type === type)
        return meta ? meta.text : null
      }
      // $FlowFixMe: temporarily partial resource now, but it'll be filled later
      const resource: Resource = { ...(state.resource || {}) }
      resource.id = getMetaText('id') || resource.id
      resource.title = getMetaText('title') || resource.title
      resource.titlePosition =
        getMetaText('titlePosition') || resource.titlePosition || 'center'
      resource.subtitle = getMetaText('subtitle') || resource.subtitle
      resource.copyright = getMetaText('copyright') || resource.copyright
      resource.topic = getMetaText('topic') || resource.topic
      resource.author = getMetaText('author') || resource.author
      // language = first summary's language found
      const foundSummary: ?{ summary: string, lang: Locale } = LOCALES.reduce(
        (found, lang) => {
          if (found) return found

          const summary = getMetaText('summary-' + lang)
          if (summary) return { summary, lang }

          return null
        },
        null,
      )
      resource.language =
        guessResourceLanguage(resource) ||
        (foundSummary ? foundSummary.lang : '')

      // Match id suffix and language
      const langFromId = guessResourceLanguage(resource)
      if (!langFromId) {
        // Add id suffix
        resource.id += `-${resource.language.toUpperCase()}`
        toast.info(<T id="bo.warning-id-add-language-suffix" values={doc} />)
      } else if (langFromId !== resource.language) {
        // Incompatible information between ID and language: ID wins
        resource.language = langFromId
        toast.error(<T id="bo.warning-inconsistent-id-language" values={doc} />)
      }

      resource.description_fr = getMetaText('summary-fr') || ''
      resource.description_en = getMetaText('summary-en') || ''
      return { parsed, resource }
    }
    const parseDoc = key === 'article' ? parseArticleDoc : parseFocusDoc
    this.parsePickedDoc(key, parseDoc, postParse, doc, accessToken)
  }

  onPickArticle = this.onPickArticleOrFocus('article')
  onPickFocus = this.onPickArticleOrFocus('focus')

  onPickLexicon = async (docs: GoogleDoc[], accessToken: string) => {
    const doc = docs[0]
    const postParse = (state, parsed) => {
      const newState: { parsed: any, resource?: Resource } = { parsed }
      if (state.resource) {
        const resource: Resource = state.resource
        newState.resource = {
          ...resource,
          title:
            resource.title ||
            this.props.intl.formatMessage({ id: 'bo.lexicon-title' }),
          language: resource.language || this.props.locale,
          description_fr:
            resource.description_fr ||
            this.props.intl.formatMessage(
              { id: 'bo.lexicon-description' },
              { nb: parsed.definitions.length },
            ),
          description_en: '',
        }
      }
      return newState
    }
    this.parsePickedDoc('lexicon', parseLexiconDoc, postParse, doc, accessToken)
  }

  getLexiconFields(): FieldParams[] {
    const { parsed } = this.state
    if (!parsed) return []

    return [
      {
        labelId: 'nb-definitions',
        input: (
          <span className="input" readOnly>
            {parsed.definitions.length}
          </span>
        ),
      },
    ]
  }

  guessResourceId(doc: GoogleDoc) {
    return doc.name.replace(RE_RESOURCE_ID, '$1')
  }

  unselectFile = (docKey: string) => e => {
    e.preventDefault()
    this.setState(state => ({
      docs: { ...state.docs, [docKey]: null },
      removedDocs: state.removedDocs.includes(docKey)
        ? state.removedDocs
        : state.removedDocs.concat([docKey]),
    }))
  }

  onChangeLanguage = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.onChangeAttr('language')(e)
    if (this.state.resource.type === 'definition') {
      this.setState(state => ({
        resource: {
          ...state.resource,
          id: LEXICON_ID(state.resource.language),
        },
      }))
    }
  }

  // TODO cache generated callbacks to avoid useless re-renders?
  onChangeAttr = (attr: string, clearDocs: boolean = false) => (
    e: SyntheticInputEvent<HTMLInputElement>,
  ) => {
    e.preventDefault()
    const value = e.target.value // beware recycled synthetic events
    this.setState(state => ({
      error: null,
      resource: { ...state.resource, [attr]: value },
      docs: clearDocs ? {} : state.docs,
      removedDocs: clearDocs ? [] : state.removedDocs,
    }))
  }

  renderSave() {
    if (!this.state.resource || !this.state.resource.type) return null

    return (
      <div className="field is-horizontal">
        <div className="field-label" />
        <div className="field-body">
          <button
            className={cx('button is-primary', {
              'is-loading': this.state.saving,
            })}
            disabled={!this.isSaveable()}>
            <Icon icon="check" />
            <span>
              <T id="bo.save-changes" />
            </span>
          </button>
        </div>
      </div>
    )
  }

  onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { resource, docs, accessToken, removedDocs } = this.state

    if (!resource || !this.isSaveable()) return

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

    this.setState({ saving: true })

    this.props
      .onSubmit(resource, uploads, accessToken || '')
      .then((resource: Resource) => {
        this.props.replaceResource(resource)
        this.setState({
          resource: { ...this.state.resource, ...resource },
          docs: this.docsFromResource(resource),
          saving: false,
          removedDocs: [],
        })
        toast.success(<T id="bo.toast-resource-saved" />)
      })
      .catch(error => this.setState({ error, saving: false }))
  }

  // TODO implement more complex validations here?
  // Will probably depend on resource type
  isSaveable() {
    const { resource, docs } = this.state

    // Common mandatory fields
    if (!resource) return false
    if (!resource.type || !resource.id) return false

    // Type-specific validation
    switch (resource.type) {
      case 'article':
        if (!docs.article) return false
        break
      case 'focus':
        if (!docs.focus) return false
        break
      case 'map':
        if (
          Object.keys(docs).filter(k => docs[k] && k.match(/^map-/)).length ===
          0
        ) {
          return false
        }
        break
      case 'image':
        if (
          Object.keys(docs).filter(k => docs[k] && k.match(/^image-/))
            .length === 0
        )
          return false
        break
      case 'video':
        return true
      case 'sound':
        if (!docs.sound) return false
        break
      case 'definition':
        if (!docs.lexicon) return false
        break
      default:
        return null
    }
    // All good!
    return true
  }

  docsFromResource(resource: ?Resource): GoogleDocs {
    const docs: { [x: string]: any } = {}

    if (!resource || !resource.id || this.props.mode === 'create') return docs

    if (resource.type === 'image' || resource.type === 'map') {
      const images = resource.images
      for (let size in images) {
        for (let density in images[size]) {
          if (!images[size][density]) {
            continue // skip null documents (was deleted)
          }
          docs[`${resource.type}-${size}-${density}`] = {
            type: 'photo',
            id: '', // No GoogleDoc id → will not be included in onSubmit's uploads
            mimeType: '',
            name: images[size][density],
          }
        }
      }
    }

    if (resource.type === 'definition') {
      docs['lexicon'] = {
        type: 'doc',
        id: '',
        mimeType: '',
        name: 'lexicon.docx',
      }
    }

    if (resource.type === 'article' || resource.type === 'focus') {
      docs[resource.type] = {
        type: 'doc',
        id: '',
        mimeType: '',
        name: slugify(resource.title) + '.docx',
      }
    }

    if (resource.type === 'sound') {
      docs['sound'] = {
        type: 'sound',
        id: '',
        mimeType: '',
        name: slugify(resource.title) + '.mp3',
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
