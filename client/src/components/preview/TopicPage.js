// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component, Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const { getImageUrl, getResource } = require('./layout')

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

const ArticleList = ({ articles, resources, options }) => {
  if (!articles || !articles.length) return null
  return h(
    'ul.container.ArticleList',
    articles.map(a => {
      const imageHeader = getResource(resources, a.imageHeader)
      // TODO small
      const imageHeaderUrl = imageHeader && getImageUrl(imageHeader, 'large', '1x')
      return h('li', [
        h('img', { alt: (imageHeader || {}).title, src: imageHeaderUrl }),
        h('div', [
          h(
            'a',
            { href: options.preview ? `/resources/${a.id}/preview` : 'TODO' },
            a.title,
          ),
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
          h('.summary', a.summaries.fr),
        ]),
      ])
    }),
  )
}

const Topic = ({ topic, topics, articles, resources, options }) => {
  return h('article.TopicPage', [
    h(TopicHeader, { topic }),
    h(ArticleList, { articles, resources, options }),
  ])
}

class TopicPreview extends Component {
  render() {
    const { topic, topics, articles, resources, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: topic.name }),
      h(Body, { topics, options }, [
        h(Topic, { topic, topics, articles, resources, options }),
      ]),
    ])
  }
}

module.exports = TopicPreview
