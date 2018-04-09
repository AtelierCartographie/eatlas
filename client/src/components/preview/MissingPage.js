// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const Content = ({ topics, articles, options }) => {
  return h('article.MissingPage', [
    h('h1', 'This page is a placeholder'),
    h('p', 'HTML generator not implemented yet?'),
  ])
}

const MissingPage = (
  {
    topics,
    articles,
    options,
  } /*: { topics: Topic[], articles: Resource[], options: Object } */,
) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'Missing page', options }),
    h(Body, { topics, options, topMenu: true }, [
      h(Content, { topics, articles, options }),
    ]),
  ])

module.exports = MissingPage
