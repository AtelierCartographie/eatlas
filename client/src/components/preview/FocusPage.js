// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const {
  PublishedAt,
  Paragraph,
  Keywords,
  Quote,
  Footnotes,
  Lexicon,
} = require('./Doc')
const Head = require('./Head')
const Body = require('./Body')
const EmbeddedResource = require('./EmbeddedResource')
const { getResourcePageUrl } = require('./layout')

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
            ? focus.relatedArticle.title
            : h('strike', focus.relatedArticleId),
        ],
      ),
    ]),
  ])

const FocusHeader = ({ focus }) =>
  h('header.FocusHeader', [
    h('.container.FocusHeaderInfo', [
      h('.FocusIcon', 'Focus'),
      h('h1.FocusTitle', focus.title),
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
    h(Quote, { doc: focus }),
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

const FocusPage = ({
  focus,
  topics,
  definitions,
  resources,
  options,
} /*: {
  focus: Resource,
  topics: Topic[],
  definitions: Definition[],
  resources: Resource[],
  options: FrontOptions,
} */) => {
  {
    const lexiconId = {
      id: 0,
    }
    return h('html', { lang: 'fr' }, [
      h(Head, { title: focus.title, options }),
      h(Body, { altTitle: focus.title, topics, options, logoColor: 'black' }, [
        h(Focus, { focus, topics, definitions, resources, lexiconId, options }),
      ]),
    ])
  }
}

module.exports = FocusPage
