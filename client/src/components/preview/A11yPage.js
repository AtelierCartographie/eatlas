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

const intlList = (intl, prefix, baseParams = {}) => {
  let elements = []
  for (let i = 1; `${prefix}${i}` in intl.messages; i++) {
    let params = { ...baseParams }
    if (`${prefix}${i}-link` in intl.messages) {
      const href = intl.formatMessage({ id: `${prefix}${i}-link` })
      const label =
        `${prefix}${i}-label` in intl.messages
          ? intl.formatMessage({ id: `${prefix}${i}-label` })
          : href
      params.link = `<a href="${href}">${label}</a>`
    }
    elements.push(intl.formatMessage({ id: prefix + i }, params))
  }
  return elements
}

// Content served when we have (almost) no translations available
const LightContent = ({ intl, options }) => {
  return h('article.container.A11yPage', [
    h('h1', { id: 'a11y-main-content' }, h(T, { id: 'a11y.title' })),

    ...intlList(intl, 'a11y.light-content-intro').map(t => h('p', {}, t)),

    h('h2', {}, h(T, { id: 'a11y.contact-title' })),
    ...intlList(intl, 'a11y.contact-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h(
      'h2',
      {},
      h(
        'a',
        {
          href: globalPageUrl('a11y')({
            ...options,
            lang: intl.formatMessage({ id: 'a11y.light-content-link-lang' }),
          }),
        },
        h(T, { id: 'a11y.light-content-link-title' }),
      ),
    ),
  ])
}

const Content = ({ intl, options }) => {
  const useLightContent = !['no', 'a11y.use-light-content'].includes(
    intl.formatMessage({ id: 'a11y.use-light-content' }),
  )
  if (useLightContent) {
    return h(LightContent, { intl, options })
  }

  return h('article.container.A11yPage', [
    h('h1', { id: 'a11y-main-content' }, h(T, { id: 'a11y.title' })),

    h('h2', {}, h(T, { id: 'a11y.rgaa-title' })),
    ...intlList(intl, 'a11y.rgaa-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.who-title' })),
    ...intlList(intl, 'a11y.who-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.techs-title' })),
    h(
      'ul',
      {},
      intlList(intl, 'a11y.techs-item').map(t =>
        h(Html, { component: 'li' }, [t]),
      ),
    ),

    h('h2', {}, h(T, { id: 'a11y.agents-title' })),
    ...intlList(intl, 'a11y.agents-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),
    h(
      'ul',
      {},
      intlList(intl, 'a11y.agents-item').map(t =>
        h(Html, { component: 'li' }, [t]),
      ),
    ),

    h('h2', {}, h(T, { id: 'a11y.pages-title' })),
    h(
      'ul',
      {},
      intlList(intl, 'a11y.pages-item').map(t =>
        h(Html, { component: 'li' }, [t]),
      ),
    ),

    h('h2', {}, h(T, { id: 'a11y.results-title' })),
    ...intlList(intl, 'a11y.results-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.tier-title' })),
    ...intlList(intl, 'a11y.tier-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.improper-title' })),
    h(
      'ul',
      {},
      intlList(intl, 'a11y.improper-item').map(t =>
        h(Html, { component: 'li' }, [t]),
      ),
    ),

    h('h2', {}, h(T, { id: 'a11y.right-title' })),
    ...intlList(intl, 'a11y.right-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.contact-title' })),
    ...intlList(intl, 'a11y.contact-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h3', {}, h(T, { id: 'a11y.contact-email-title' })),
    ...intlList(intl, 'a11y.contact-email-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),

    h('h2', {}, h(T, { id: 'a11y.defender-title' })),
    ...intlList(intl, 'a11y.defender-line').map(t =>
      h(Html, { component: 'p' }, [t]),
    ),
    h(
      'ul',
      {},
      intlList(intl, 'a11y.defender-item').map(t =>
        h(Html, { component: 'li' }, [t]),
      ),
    ),
  ])
}

const A11yPage = injectIntl((
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
    h(Head, { title: intl.formatMessage({ id: 'a11y.title' }), options }),
    h(
      Body,
      {
        topics,
        options,
        logoColor: 'black',
        linkContent: '#a11y-main-content',
      },
      [h(Content, { topics, articles, options, intl })],
    ),
  ]),
)

module.exports = A11yPage
