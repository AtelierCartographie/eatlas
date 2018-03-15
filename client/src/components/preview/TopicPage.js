// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const { getImageUrl, getResourcePageUrl } = require('./layout')

const TopicVideo = ({ url }) => {
  if (!url) return null
  const id = url.slice('https://vimeo.com/'.length)
  return h('iframe.TopicVideo', {
    title: 'TODO',
    src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    frameBorder: 0,
    allowFullScreen: true,
  })
}

const TopicHeader = ({ topic }) => {
  return h('header.TopicHeader', [
    h('.container', [
      h('h1', [h('.TopicId', topic.id - 1), h('.TopicName', topic.name)]),
      h('div', [h(TopicVideo, { url: topic.mediaUrl })]),
    ]),
  ])
}

const ArticleList = ({ articles, topics, options }) => {
  if (!articles || !articles.length) return null
  return h(
    'ul.container.ArticleList',
    articles.map(a => {
      return h('li', [
        h('a', { href: getResourcePageUrl(a, topics, options) }, [
          h('img', {
            alt: '',
            style: {
              backgroundImage:
                a.imageHeader &&
                `url(${getImageUrl(a.imageHeader, 'large', '1x', options)})`,
            },
          }),
          h('.ArticleListInfo', [
            h('.ArticleListTitle', a.title),
            h(
              '.publishedAt',
              !a.publishedAt
                ? 'Pas encore publié'
                : [
                    'Publié le',
                    h(
                      'time',
                      { dateTime: a.publishedAt },
                      moment(a.publishedAt).format('D MMMM YYYY'),
                    ),
                  ],
            ),
            a.summaries.fr,
          ]),
        ]),
        a.focus &&
          h('.ArticleListFocus', [
            h('div', [
              h(
                'a',
                {
                  href: getResourcePageUrl(a.focus, topics, options),
                },
                [h('.FocusIcon', 'Focus'), a.focus.title],
              ),
            ]),
          ]),
      ])
    }),
  )
}

const Topic = ({ topic, articles, topics, options }) => {
  return h('article.TopicPage', [
    h(TopicHeader, { topic }),
    h(ArticleList, {
      articles: articles.filter(a => a.topic === topic.id),
      topics,
      options,
    }),
  ])
}

class TopicPage extends Component {
  render() {
    const { topic, topics, articles, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: topic.name }),
      h(Body, { topic, topics, articles, options, topMenu: true }, [
        h(Topic, { topic, topics, articles, options }),
      ]),
    ])
  }
}

module.exports = TopicPage
