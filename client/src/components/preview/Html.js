const h = require('react-hyperscript')
const { stripTags } = require('../../universal-utils')
const { ensureHTML } = require('./layout')

const Html = props => {
  // Default = only keep inline formatting
  const whitelist = props.whitelist || ['em', 'i', 'strong', 'b', 'a']

  const content =
    props.children === null
      ? null
      : whitelist === 'all'
        ? props.noP
          ? String(props.children)
          : ensureHTML(String(props.children))
        : stripTags(String(props.children), whitelist)
  if (content === null) {
    return null
  }

  const component = props.component || 'div'

  const newProps = Object.assign({}, props)
  delete newProps.component
  delete newProps.children
  delete newProps.whitelist
  delete newProps.noP
  newProps.dangerouslySetInnerHTML = { __html: content }

  return h(component, newProps)
}

module.exports = Html
