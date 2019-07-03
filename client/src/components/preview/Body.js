// @flow

const h = require('react-hyperscript')

const { CDN, prefixUrl } = require('./layout')
const TopBar = require('./TopBar')
const { SideMenu } = require('./SideMenu')
const Footer = require('./Footer')

module.exports = (
  {
    topics,
    logoColor,
    altTitle,
    options,
    children,
    scripts = [],
  } /*: {
  topics: Topic[],
  logoColor: 'black' | 'white',
  options: FrontOptions,
  children: any,
} */,
) =>
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
      // Polyfill for CSS object-fit in IE
      src: prefixUrl('/assets/js/fitie.js', options.preview),
    }),
    h('script', {
      src: `${CDN}/jquery/3.3.1/jquery.slim.min.js`,
    }),
    h('script', {
      src: prefixUrl('/assets/js/lodash.custom.min.js', options.preview),
    }),
    h('script', {
      src: prefixUrl('/assets/js/bootstrap.custom.min.js', options.preview),
    }),
    h('script', {
      src: `${CDN}/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/picturefill/3.0.3/picturefill.min.js`,
    }),
    ...scripts.map(src => h('script', { src })),
    h('script', {
      src: prefixUrl('/assets/js/eatlas.es5.js', options.preview),
    }),
  ])
