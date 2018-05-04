// @flow

const h = require('react-hyperscript')
const { prefixUrl } = require('./layout')

module.exports = ({ logoColor, options: { preview } }) =>
  h('nav.navbar.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: preview ? '/preview' : 'TODO' }, [
        h('img', {
          alt: "Page d'accueil",
          src: prefixUrl(`/assets/img/logo-eatlas-${logoColor}.svg`, preview),
        }),
      ]),
    ]),
  ])

