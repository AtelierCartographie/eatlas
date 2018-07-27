// @flow

const h = require('react-hyperscript')

const { CDN, prefixUrl } = require('./layout')
const TopBar = require('./TopBar')
const { SideMenu, SideMenuToggle } = require('./SideMenu')
const Footer = require('./Footer')

module.exports = ({
  topics,
  logoColor,
  options,
  children,
} /*: {
  topics: Topic[],
  logoColor: 'black' | 'white',
  options: FrontOptions,
  children: any,
} */) =>
  // display preview ribbon in corner
  h('body', { className: options.preview ? 'preview' : '' }, [
    h(TopBar, { logoColor: logoColor || 'white', options }),
    h(SideMenuToggle, { options }),
    h(SideMenu, { topics, options }),
    h('main', { role: 'main' }, [children]),
    h(Footer, { topics, options }),
    h('script', {
      src: `${CDN}/jquery/3.3.1/jquery.min.js`,
    }),
    h('script', {
      src: `${CDN}/lodash.js/4.17.5/lodash.min.js`,
    }),
    h('script', {
      src: `${CDN}/twitter-bootstrap/3.3.7/js/bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/picturefill/3.0.3/picturefill.min.js`,
    }),
    h('script', {
      src: prefixUrl('/assets/js/eatlas.es5.js', options.preview),
    }),
  ])
