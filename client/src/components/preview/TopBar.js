// @flow

const h = require('react-hyperscript')
const { prefixUrl } = require('./layout')
const SearchToggle = require('./SearchBar')
const { SideMenuToggle } = require('./SideMenu')

module.exports = ({
  logoColor,
  options,
} /*: {
  logoColor: string,
  options: FrontOptions,
} */) =>
  h('nav#topbar.navbar.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: options.preview ? '/preview' : 'TODO' }, [
        h('img.if-not-scrolled', {
          alt: "Page d'accueil",
          src: prefixUrl(`/assets/img/logo-eatlas-${logoColor}.svg`, options.preview),
        }),
        h('img.if-scrolled', {
          alt: "Page d'accueil",
          src: prefixUrl(`/assets/img/logo-eatlas-black.svg`, options.preview),
        }),
      ]),
    ]),
    h(SideMenuToggle, { options }),
    h(SearchToggle, { options }),
  ])
