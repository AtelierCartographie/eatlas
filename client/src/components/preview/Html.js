const h = require('react-hyperscript')
const { stripTags } = require('../../universal-utils')
const { ensureHTML } = require('./layout')
const { injectIntl } = require('react-intl')

const Html = injectIntl(props => {
  // Default = only keep inline formatting
  const whitelist = props.whitelist || ['em', 'i', 'strong', 'b', 'a']

  const childContent = props.children
    ? typeof props.children === 'string'
      ? props.children
      : props.children.join
        ? props.children.join('')
        : String(props.children)
    : null

  const content =
    childContent === null
      ? null
      : whitelist === 'all'
        ? props.noP
          ? handleExternalLinksTitle(childContent, props.intl)
          : handleExternalLinksTitle(
              ensureHTML(String(childContent)),
              props.intl,
            )
        : handleExternalLinksTitle(
            stripTags(String(childContent), whitelist),
            props.intl,
          )

  if (content === null) {
    return null
  }

  const component = props.component || 'div'

  const newProps = Object.assign({}, props)
  delete newProps.component
  delete newProps.children
  delete newProps.whitelist
  delete newProps.noP
  delete newProps.intl
  newProps.dangerouslySetInnerHTML = { __html: content }

  return h(component, newProps)
})

const RE_LINKS = /<a(.*?)>(.*?)<\/a>/gi
const RE_TITLE = /\stitle=(?:(?:["'](.*?)["'])|(?:([^\s]+)))/
const RE_TARGET_BLANK = /\starget=["']?_blank["']?/
const RE_A = /<a/

const handleExternalLinksTitle = (html, intl) => {
  const newWindowMarker = intl.formatMessage(
    { id: 'fo.link-new-window-title' },
    { title: '' },
  )
  return html.replace(RE_LINKS, (match, attrs, text) => {
    if (!attrs.match(RE_TARGET_BLANK)) {
      return match
    }
    const matchTitle = ` ${attrs}`.match(RE_TITLE)
    let title = matchTitle ? matchTitle[1] || matchTitle[2] : text
    if (title.indexOf(newWindowMarker) === -1) {
      title = intl.formatMessage({ id: 'fo.link-new-window-title' }, { title })
    }
    return matchTitle
      ? match.replace(RE_TITLE, ` title="${title}"`)
      : match.replace(RE_A, `<a title="${title}"`)
  })
}

module.exports = Html
