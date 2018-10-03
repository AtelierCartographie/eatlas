// @flow
const h = require('react-hyperscript')
const { CDN, prefixUrl } = require('./layout')
const googleAnalyticsScript = require('./google-analytics-script')
const { injectIntl } = require('react-intl')

module.exports = injectIntl((
  {
    title,
    options,
    links = [],
    intl,
  } /*: { title: string, options: Object } */,
) =>
  h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', `${title} - ${intl.formatMessage({ id: 'fo.title' })}`),
    h('link', {
      rel: 'shortcut icon',
      href: prefixUrl('/assets/img/favicon.ico'),
      type: 'image/x-icon',
    }),
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
      href: `${CDN}/selectize.js/0.12.6/css/selectize.default.min.css`,
    }),
    ...links.map(
      ({ href, title, type, rel = 'alternate', hreflang = intl.locale }) =>
        h('link', { rel, href, title, hreflang, type }),
    ),
    ...(options.analytics && options.analytics.google
      ? googleAnalyticsScript(h, options.analytics.google)
      : []),
  ]),
)
