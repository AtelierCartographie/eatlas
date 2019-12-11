// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const Head = require('./Head')
const Body = require('./Body')
const { stripTags } = require('../../universal-utils')

const ul = (urls, intl) => {
  if (!urls || urls.length === 0) {
    return null
  }

  return h(
    'ul',
    urls.map(({ title, info, url, children, i18nTitle, lang }) =>
      h('li', { key: title }, [
        h('a', { href: url, lang: lang === intl.lang ? undefined : lang }, [
          h(
            'span.title',
            i18nTitle ? intl.formatMessage({ id: title }) : stripTags(title),
          ),
        ]),
        ' ',
        info
          ? h(
              'span.info',
              {},
              intl.formatMessage(
                { id: 'fo.sitemap.info' },
                { info: intl.formatMessage({ id: info }) },
              ),
            )
          : null,
        ul(children, intl),
      ]),
    ),
  )
}

const Content = ({ urls, options, intl }) =>
  h('article.container.SitemapPage', [
    h('h1', {}, h(T, { id: 'fo.sitemap.title' })),
    ul(urls, intl),
  ])

const SitemapPage = injectIntl((
  {
    urls,
    topics,
    options,
    intl,
  } /*: {
  // type Link = { url: string, title: string, info: string?, children: Link[] }
  urls: Link[],
  topics: Topic[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: intl.formatMessage({ id: 'fo.sitemap.title' }), options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Content, { urls, options, intl }),
    ]),
  ]),
)

module.exports = SitemapPage
