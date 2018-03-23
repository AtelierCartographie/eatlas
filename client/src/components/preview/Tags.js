// @flow
const h = require('react-hyperscript')

const HOST = preview => (preview ? process.env.REACT_APP_ADMIN_URL || '' : '')

exports.Script = ({ src, options: { preview = false } = {} }) =>
  h('script', { src: `${HOST(preview)}${src}` })

exports.StyleSheet = ({ href, options: { preview = false } = {} }) =>
  h('link', { rel: 'stylesheet', href: `${HOST(preview)}${href}` })

exports.Img = ({ className, alt, src, options: { preview = false } = {} }) =>
  h('img', { className, alt, src: `${HOST(preview)}${src}` })
