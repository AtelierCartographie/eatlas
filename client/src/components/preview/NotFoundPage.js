// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const { globalPageUrl } = require('./layout')
const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')

const Content = injectIntl(({ options, intl }) => {
  return h('article.container.NotFoundPage', [
    h('h1', {}, h(T, { id: 'fo.page-not-found' })),
    h('p', {}, h(T, { id: 'fo.page-not-found-intro' })),
    h(
      Html,
      { whitelist: 'all' },
      intl.formatHTMLMessage(
        { id: 'fo.page-not-found-link-html' },
        { href: globalPageUrl('about', null, 'contact')(options) },
      ),
    ),
    h('p.back-home', [
      h(
        'a.button.btn',
        {
          href: globalPageUrl('index')(options),
          role: 'link',
        },
        h(T, { id: 'fo.back-home' }),
      ),
    ]),
  ])
})

const NotFoundPage = injectIntl((
  { topics, options, intl } /*: {
  topics: Topic[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, {
      title: intl.formatMessage({ id: 'fo.page-not-found' }),
      options,
    }),
    h(Body, { topics, options, logoColor: 'black' }, [h(Content, { options })]),
  ]),
)

module.exports = NotFoundPage
