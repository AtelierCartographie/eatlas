// @flow
const h = require('react-hyperscript')
const { CDN, prefixUrl } = require('./layout')
const { stripTags } = require('../../universal-utils')
const googleAnalyticsScript = require('./google-analytics-script')
const { injectIntl } = require('react-intl')

const renderSocialMetas = (
  intl,
  defaultTitle,
  { title = '', description = '', url = '', image = '' } = {},
  preview,
) =>
  [
    (title || defaultTitle) && {
      property: 'og:title',
      content: title || defaultTitle,
    },
    description && { property: 'og:description', content: description },
    image && { property: 'og:image', content: image },
    url && { property: 'og:url', content: url },
    { property: 'twitter:card', content: 'summary_large_image' },
  ]
    // Remove empty props
    .filter(p => !!p)
    // Convert content (i18n, trim, stripTags…)
    .map(p => {
      if (typeof p.content === 'object') {
        p.content = intl.formatMessage(p.content)
      }
      p.content = stripTags(String(p.content)).trim()
      return p
    })
    // Absolutize URLs
    .map(p => {
      if (
        (p.property === 'og:url' || p.property === 'og:image') &&
        !p.content.match(/:\/\//)
      ) {
        p.content = prefixUrl(p.content, preview)
      }
      return p
    })
    // Render elements
    .map(p => h('meta', p))

module.exports = injectIntl((
  {
    title,
    options,
    links = [],
    styles = [],
    intl,
  } /*: { title: string, options: Object, socialMetas?: SocialMetas } */,
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
    ...renderSocialMetas(intl, title, options.socialMetas, options.preview),
    h('link', {
      rel: 'stylesheet',
      href: prefixUrl('/assets/css/bootstrap.min.css', options.preview),
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
    ...styles.map(href => h('link', { rel: 'stylesheet', href })),
    ...links.map(
      ({ href, title, type, rel = 'alternate', lang = intl.locale }) =>
        h('link', { rel, href, title, hrefLang: lang, type }),
    ),
    ...Object.keys(intl.urls).map(lang =>
      h('link', { rel: 'alternate', href: intl.urls[lang], hrefLang: lang }),
    ),
    ...(options.analytics && options.analytics.google
      ? googleAnalyticsScript(h, options.analytics.google)
      : []),
  ]),
)
