// @flow

const h = require('react-hyperscript')

const { CDN, prefixUrl } = require('./layout')
const TopBar = require('./TopBar')
const { SideMenu } = require('./SideMenu')
const Footer = require('./Footer')

module.exports = ({
  topics,
  logoColor,
  altTitle,
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
    h(TopBar, { altTitle, logoColor: logoColor || 'white', options }),
    h(SideMenu, { topics, options }),
    h('main', { role: 'main' }, [children]),
    h(Footer, { topics, options }),
    h('script', {
      // Array.from, URLSearchParams, and other features required by eatlas.js
      src: 'https://cdn.polyfill.io/v2/polyfill.min.js',
    }),
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
      src: `${CDN}/selectize.js/0.12.6/js/standalone/selectize.min.js`,
    }),
    h('script', {
      src: prefixUrl('/assets/js/eatlas.es5.js', options.preview),
    }),
  ])
