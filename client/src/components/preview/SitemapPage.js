// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')
const { stripTags } = require('../../universal-utils')

const ul = urls => {
  if (!urls || urls.length === 0) {
    return null
  }

  return h(
    'ul',
    urls.map(({ title, info, url, children }) =>
      h('li', { key: title }, [
        h('a', { href: url }, [h('span.title', stripTags(title))]),
        ' ',
        info ? h('span.info', info) : null,
        ul(children),
      ]),
    ),
  )
}

const Content = ({ urls, options }) =>
  h('article.container.SitemapPage', [h('h1', 'Plan du site'), ul(urls)])

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
    h(Head, { title: 'Plan du site', options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Content, { urls, options }),
    ]),
  ]),
)

module.exports = SitemapPage
