// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const Head = require('./Head')
const Body = require('./Body')

const Content = ({ intl }) => {
  return h('article.container.AboutUsLegalsPage', [
    h('h1', {}, h(T, { id: 'legals.title' })),

    h('h2', {}, h(T, { id: 'legals.who-title' })),
    h('p', {}, [
      h(T, { id: 'legals.who-name' }),
      h('br'),
      h(T, { id: 'legals.who-addr-1' }),
      h('br'),
      h(T, { id: 'legals.who-addr-2' }),
      h('br'),
      h(T, { id: 'legals.who-tel' }),
      h('br'),
      h(T, { id: 'legals.who-fax' }),
      h('br'),
      h(T, { id: 'legals.who-mail' }),
    ]),

    h('h2', {}, h(T, { id: 'legals.director-title' })),
    h('p', {}, h(T, { id: 'legals.director-text' })),

    h('h2', {}, h(T, { id: 'legals.hosting-title' })),
    h('p', [
      h(T, { id: 'legals.hosting-intro' }),
      h('br'),
      h(T, { id: 'legals.hosting-name' }),
      h('br'),
      h(T, { id: 'legals.hosting-ape' }),
      h('br'),
      h(T, { id: 'legals.hosting-addr-1' }),
      h('br'),
      h(T, { id: 'legals.hosting-addr-2' }),
    ]),

    h('h2', {}, h(T, { id: 'legals.ip-title' })),
    h('p', {}, h(T, { id: 'legals.ip-protection' })),
    h('p', {}, h(T, { id: 'legals.ip-property' })),

    h('h2', {}, h(T, { id: 'legals.links' })),
    h('p', {}, h(T, { id: 'legals.links-disclaimer' })),
    h('p', {}, h(T, { id: 'legals.links-agreement' })),
  ])
}

const AboutUsLegalsPage = injectIntl((
  {
    topics,
    articles,
    options,
    intl,
  } /*: {
  topics: Topic[],
  articles: Resource[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: intl.formatMessage({ id: 'legals.title' }), options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Content, { topics, articles, options, intl }),
    ]),
  ]),
)

module.exports = AboutUsLegalsPage
