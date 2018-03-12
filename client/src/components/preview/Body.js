// @flow

const h = require('react-hyperscript')

const { Menu, MenuToggle } = require('./Menu')
const Footer = require('./Footer')
const { Img, Script } = require('./Tags')

const NavBar = () =>
  h('nav.navbar.navbar-default.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: '#' }, [
        h(Img, { alt: 'eatlas logo', src: '/assets/img/logo-atlas-B.svg' }),
      ]),
    ]),
  ])

module.exports = ({ topics, options, children }) =>
  // display preview ribbon in corner
  h('body', { className: options.preview ? 'preview' : ''}, [
    h(NavBar),
    h(Menu, { topics, options }),
    h(MenuToggle),
    children,
    h(Footer, { topics, options }),
    h('script', {
      src: 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js',
    }),
    h('script', {
      src:
        'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js',
    }),
    h('script', {
      src:
        'https://cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js',
    }),
    h(Script, { src: '/assets/js/eatlas.js' }),
  ])
