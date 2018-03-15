// @flow

const h = require('react-hyperscript')

const { TopMenu } = require('./TopMenu')
const { SideMenu, SideMenuToggle } = require('./SideMenu')
const Footer = require('./Footer')
const { Img, Script } = require('./Tags')

const NavBar = ({ logoColor }) =>
  h('nav.navbar.navbar-default.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: '#' }, [
        h(Img, { alt: 'eatlas logo', src: `/assets/img/logo-eatlas-${logoColor}.svg` }),
      ]),
    ]),
  ])

module.exports = ({ topic, topics, sideMenu, topMenu, logoColor, options, children }) =>
  // display preview ribbon in corner
  h('body', { className: options.preview ? 'preview' : ''}, [
    h(NavBar, { logoColor: logoColor || 'white' }),
    sideMenu && h(SideMenuToggle),
    sideMenu && h(SideMenu, { topics, options }),
    topMenu && h(TopMenu, { topic, topics, options }),
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
