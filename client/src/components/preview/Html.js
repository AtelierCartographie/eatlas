const h = require('react-hyperscript')
const { stripTags } = require('../../universal-utils')
const { ensureHTML } = require('./layout')

const Html = props => {
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
          ? childContent
          : ensureHTML(String(childContent))
        : stripTags(String(childContent), whitelist)

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
