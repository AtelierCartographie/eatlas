// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')
const { PublishedAt } = require('./Doc')
const Summaries = require('./Summaries')

const {
  getImageUrl,
  getResourcePageUrl,
  prefixUrl,
  articleHeaderImageUrl,
} = require('./layout')
const { stripTags, topicName } = require('../../universal-utils')

const TopicVideo = ({ title, url }) => {
  if (!url) return null
  const id = url.slice('https://vimeo.com/'.length)
  return h('iframe.TopicVideo', {
    title,
    src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    frameBorder: 0,
    allowFullScreen: true,
  })
}

const TopicHeader = ({ topic, title, resources, options }) => {
  const resource = resources.find(
    r =>
      r.id === topic.resourceId &&
      (r.status === 'published' || options.preview),
  )
  let resourceComponent = null
  if (resource) {
    switch (resource.type) {
      case 'image':
        resourceComponent = h('div', [
          h('img.TopicImage', {
            src: getImageUrl(resource, 'large', '1x', options),
            alt: stripTags(resource.title),
          }),
        ])
        break
      case 'video':
        resourceComponent = h('div', [
          h(TopicVideo, { title, url: resource.mediaUrl }),
        ])
        break
      default:
        resourceComponent = null
    }
  }

  const bg = prefixUrl(
    `/assets/img/headers/topic-${topic.id}.png`,
    options.preview,
  )

  return h(
    'header.TopicHeader',
    {
      style: {
        backgroundImage: `url(${bg})`,
      },
    },
    [
      h('.container', [
        h('h1', [
          h('.TopicId', topic.id !== '0' && topic.id),
          h('.TopicName', title),
        ]),
        resourceComponent,
      ]),
    ],
  )
}

const ArticleList = ({ articles, options, lang }) => {
  if (!articles || !articles.length) return null
  return h(
    'ul.container.ArticleList',
    articles.map(a => {
      return h('li', [
        h('a', { href: getResourcePageUrl(a, options) }, [
          h('img', {
            alt: '',
            style: {
              backgroundImage: articleHeaderImageUrl(a, options),
            },
          }),
          h('.ArticleListInfo', [
            h(Html, { component: '.ArticleListTitle' }, a.title),
            h(PublishedAt, { doc: a }),
            h(
              Html,
              { component: '.ArticleListSummary' },
              a.summaries[lang] || a.summaries[a.language],
            ),
          ]),
        ]),
        a.focus &&
          h('.ArticleListFocus', [
            h('div', [
              h(
                'a',
                {
                  href: getResourcePageUrl(a.focus, options),
                },
                [
                  h('.FocusIcon', {}, h(T, { id: 'doc.type.focus' })),
                  a.focus.title,
                ],
              ),
            ]),
          ]),
      ])
    }),
  )
}

const Topic = ({ topic, title, topics, articles, resources, options, lang }) =>
  h('article.TopicPage', [
    h(TopicHeader, { topic, title, resources, options }),
    h(Summaries, { doc: topic }),
    h(ArticleList, {
      articles: articles.filter(a => a.topic === topic.id),
      topics,
      options,
      lang,
    }),
  ])

const TopicPage = injectIntl((
  {
    topic,
    topics,
    articles,
    resources,
    options,
    intl,
  } /*: {
  topic: Topic,
  topics: Topic[],
  articles: Resource[],
  resources: Resource[],
  options: FrontOptions,
} */,
) => {
  const lang = intl.lang
  const title = topicName(topic, lang)
  return h('html', { lang }, [
    h(Head, { title, options }),
    h(Body, { altTitle: `${topic.id}. ${title}`, topics, options }, [
      h(Topic, { topic, title, topics, articles, resources, options }),
    ]),
  ])
})

module.exports = TopicPage
