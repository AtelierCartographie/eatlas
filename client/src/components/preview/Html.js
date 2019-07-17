const h = require('react-hyperscript')
const { stripTags } = require('../../universal-utils')
const { ensureHTML } = require('./layout')
const { injectIntl } = require('react-intl')

const Html = injectIntl((
  props /*: {
    noP?: boolean,
    keepOriginalLinks?: boolean,
    component?: string | Component,
    children?: string | string[] | Component,
    whitelist?: 'all' | string[],
    intl?: any,
  }*/,
) => {
  // Default = only keep inline formatting
  const whitelist = props.whitelist || ['em', 'i', 'strong', 'b', 'a']

  const childContent = props.children
    ? typeof props.children === 'string'
      ? props.children
      : props.children.join
        ? props.children.join('')
        : String(props.children)
    : null

  let content =
    childContent === null
      ? null
      : whitelist === 'all'
        ? props.noP
          ? childContent
          : ensureHTML(String(childContent))
        : stripTags(String(childContent), whitelist)

  if (content === null) {
    return null
  }

  if (props.intl && !props.keepOriginalLinks) {
    content = handleLinks(content, props.intl)
  }

  const component = props.component || 'div'

  const newProps = Object.assign({}, props)
  delete newProps.component
  delete newProps.children
  delete newProps.whitelist
  delete newProps.noP
  delete newProps.intl
  delete newProps.keepOriginalLinks
  newProps.dangerouslySetInnerHTML = { __html: content }

  return h(component, newProps)
})

// #a11y: all links provided by WYSIWYG contents open a new window

const RE_LINKS = /<a(.*?)>(.*?)<\/a>/gi
const RE_TITLE = /\stitle=(?:(?:["'](.*?)["'])|(?:([^\s]+)))/
const RE_TARGET = /\starget=["']?([^\s]+)["']?/
const RE_A = /<a/

const handleLinks = (html, intl) => {
  const newWindowMarker = intl.formatMessage(
    { id: 'fo.link-new-window-title' },
    { title: '' },
  )
  return html.replace(RE_LINKS, (match, attrs, text) => {
    const sattrs = ` ${attrs}` // prepend with an initial space to include first attr
    const matchTitle = sattrs.match(RE_TITLE)
    let title = matchTitle ? matchTitle[1] || matchTitle[2] : text
    if (title.indexOf(newWindowMarker) === -1) {
      title = intl.formatMessage({ id: 'fo.link-new-window-title' }, { title })
    }
    const replacedTitle = matchTitle
      ? match.replace(RE_TITLE, ` title="${title}"`)
      : match.replace(RE_A, `<a title="${title}"`)
    const matchTarget = sattrs.match(RE_TARGET)
    return matchTarget
      ? replacedTitle.replace(RE_TARGET, ` target="_blank"`)
      : replacedTitle.replace(RE_A, '<a target="_blank"')
  })
}

module.exports = Html
