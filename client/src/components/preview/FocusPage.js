// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const moment = require('moment')
moment.locale('fr')

const {
  PublishedAt,
  Paragraph,
  Keywords,
  Quote,
  Footnotes,
  Lexicon,
  exportLinks,
} = require('./Doc')
const Head = require('./Head')
const Body = require('./Body')
const EmbeddedResource = require('./EmbeddedResource')
const Html = require('./Html')
const { getResourcePageUrl } = require('./layout')
const { stripTags } = require('../../universal-utils')

// subcomponents

const FocusBackToArticle = ({ focus, options }) =>
  h('.FocusBackToArticle', [
    h('.container', [
      h(
        'a',
        {
          href: focus.relatedArticle
            ? getResourcePageUrl(focus.relatedArticle, options)
            : '#ARTICLE_NOT_FOUND',
        },
        [
          '< ',
          focus.relatedArticle
            ? h(Html, { component: 'span' }, focus.relatedArticle.title)
            : h(Html, { component: 'strike' }, focus.relatedArticleId),
        ],
      ),
    ]),
  ])

const FocusHeader = ({ focus }) =>
  h('header.FocusHeader', [
    h('.container.FocusHeaderInfo', [
      h('.FocusIcon', {}, h(T, { id: 'doc.type.focus' })),
      h(Html, { component: 'h1.FocusTitle' }, focus.title),
      h(PublishedAt, { doc: focus }),
    ]),
  ])

const FocusNodes = ({ focus, lexiconId, resources, options }) => {
  return focus.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', { key: n.id }, n.text)
      case 'p':
        return h(Paragraph, { p: n, key: n.id, lexiconId })
      case 'resource': {
        const resource = resources.find(r => r.id === n.id)
        return !resource
          ? null
          : h(EmbeddedResource, { resource, options, key: n.id })
      }
      default:
        return null
    }
  })
}

const FocusFooter = ({ focus, options }) =>
  h('footer.DocFooter', [
    h(Keywords, { keywords: focus.keywords, options }),
    h(Quote, { doc: focus, options }),
    h(Footnotes, { references: focus.references, footnotes: focus.footnotes }),
  ])

const Focus = props =>
  h('article.FocusPage', [
    h(FocusBackToArticle, props),
    h(FocusHeader, props),
    h(FocusNodes, props),
    h(FocusFooter, props),
    h(Lexicon, {
      nodes: props.focus.nodes,
      definitions: props.definitions,
      options: props.options,
    }),
  ])

const FocusPage = injectIntl((
  {
    focus,
    topics,
    definitions,
    resources,
    options,
    intl,
  } /*: {
  focus: Resource,
  topics: Topic[],
  definitions: Definition[],
  resources: Resource[],
  options: FrontOptions,
} */,
) => {
  const lexiconId = {
    id: 0,
  }
  return h('html', { lang: intl.lang }, [
    h(Head, {
      title: stripTags(focus.title),
      links: exportLinks({ doc: focus, intl, options }),
      options,
    }),
    h(
      Body,
      {
        altTitle: stripTags(focus.title),
        topics,
        options,
        logoColor: 'black',
      },
      [
        h(Focus, {
          focus,
          topics,
          definitions,
          resources,
          lexiconId,
          options,
        }),
      ],
    ),
  ])
})

module.exports = FocusPage
