// @flow
const h = require('react-hyperscript')

const HOST = process.env.REACT_APP_ADMIN_URL || ''

exports.Script = ({ src }) => h('script', { src: `${HOST}${src}` })

exports.StyleSheet = ({ href }) =>
  h('link', { rel: 'stylesheet', href: `${HOST}${href}` })

exports.Img = ({ className, alt, src }) =>
  h('img', { className, alt, src: `${HOST}${src}` })
