// @flow
const h = require('react-hyperscript')

const HOST = preview => (preview ? process.env.REACT_APP_ADMIN_URL || '' : '')

exports.Script = (
  {
    src,
    options: { preview = false } = {},
  } /*: { src: string, options: Object }*/,
) => h('script', { src: `${HOST(preview)}${src}` })

exports.StyleSheet = (
  {
    href,
    options: { preview = false } = {},
  } /*: { href: string, options: Object }*/,
) => h('link', { rel: 'stylesheet', href: `${HOST(preview)}${href}` })

exports.Img = (
  {
    className,
    alt,
    src,
    options: { preview = false } = {},
  } /*: { className: string, alt: string, src: string, options: Object }*/,
) => h('img', { className, alt, src: `${HOST(preview)}${src}` })
