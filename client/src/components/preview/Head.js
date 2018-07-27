// @flow
const h = require('react-hyperscript')
const { CDN, prefixUrl } = require('./layout')

module.exports = (
  { title, options } /*: { title: string, options: Object } */,
) =>
  h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', `${title} - eAtlas`),
    h('link', {
      rel: 'stylesheet',
      href: `${CDN}/twitter-bootstrap/3.3.7/css/bootstrap.min.css`,
    }),
    h('link', {
      rel: 'stylesheet',
      href: `${CDN}/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css`,
    }),
    h('link', {
      rel: 'stylesheet',
      href: prefixUrl('/assets/index.css', options.preview),
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,700,700i',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Gentium+Basic:400,400i,700,700i',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        `${CDN}/selectize.js/0.12.6/css/selectize.default.min.css`,
    }),
  ])
