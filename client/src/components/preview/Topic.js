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

const TopicVideo = ({ url }) => {
  if (!url) return null
  const id = url.slice('https://vimeo.com/'.length)
  return h('iframe', {
    title: 'TODO',
    src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    frameBorder: 0,
    allowFullScreen: true,
  })
}

const TopicHeader = ({ topic }) => {
  return h('section.container', [
    h('h1', `${topic.id} ${topic.name}`),
    h('div', [h(TopicVideo, { url: topic.mediaUrl })]),
  ])
}

const ArticleList = ({ articles, options }) => {
  if (!articles || !articles.length) return null
  return h(
    'ul',
    articles.map(a =>
      h('li', [
        h(
          'a',
          { href: options.preview ? `/resources/${a.id}/preview` : 'TODO' },
          a.title,
        ),
      ]),
    ),
  )
}

const Topic = ({ topic, topics, articles, options }) => {
  return h('article.topic', [
    h(TopicHeader, { topic }),
    h(ArticleList, { articles, options }),
  ])
}

class TopicPreview extends Component {
  render() {
    const { topic, topics, articles, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: topic.name }),
      h(Body, { topics, options }, [
        h(Topic, { topic, topics, articles, options }),
      ]),
    ])
  }
}

module.exports = TopicPreview
