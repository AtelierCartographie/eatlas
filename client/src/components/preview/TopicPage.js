// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')
const { PublishedAt } = require('./Doc')

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

const TopicHeader = ({ topic, resources, options }) => {
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
            alt: resource.title,
          }),
        ])
        break
      case 'video':
        resourceComponent = h('div', [
          h(TopicVideo, { url: resource.mediaUrl }),
        ])
        break
    }
  }

  return h('header.TopicHeader', [
    h('.container', [
      h('h1', [h('.TopicId', topic.id), h('.TopicName', topic.name)]),
      resourceComponent,
    ]),
  ])
}

const TopicDescriptions = ({ topic }) =>
  h('section.container.Summaries', [
    // pills
    !topic.description_en
      ? null
      : h('ul.langs', { role: 'tablist' }, [
          h('li.active', { role: 'presentation' }, [
            h(
              'a',
              {
                href: '#french',
                role: 'tab',
                'data-toggle': 'pill',
                hrefLang: 'fr',
              },
              'Fr',
            ),
          ]),
          h('li', { role: 'presentation' }, [
            h(
              'a',
              {
                href: '#english',
                role: 'tab',
                'data-toggle': 'pill',
                hrefLang: 'en',
              },
              'En',
            ),
          ]),
        ]),
    // panes
    h('.tab-content', [
      h('.tab-pane.active#french', { role: 'tabpanel', lang: 'fr' }, [
        h('h2.line', 'Résumé'),
        h('p', topic.description_fr),
      ]),
      !topic.description_en
        ? null
        : h('.tab-pane#english', { role: 'tabpanel', lang: 'en' }, [
            h('h2.line', 'Summary'),
            h('p', topic.description_en),
          ]),
    ]),
  ])

const ArticleList = ({ articles, options }) => {
  if (!articles || !articles.length) return null
  return h(
    'ul.container.ArticleList',
    articles.map(a => {
      return h('li', [
        h('a', { href: getResourcePageUrl(a, options) }, [
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
            h(PublishedAt, { doc: a }),
            h('.ArticleListSummary', a.summaries.fr),
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
                [h('.FocusIcon', 'Focus'), a.focus.title],
              ),
            ]),
          ]),
      ])
    }),
  )
}

const Topic = ({ topic, topics, articles, resources, options }) =>
  h('article.TopicPage', [
    h(TopicHeader, { topic, resources, options }),
    h(TopicDescriptions, { topic }),
    h(ArticleList, {
      articles: articles.filter(a => a.topic === topic.id),
      topics,
      options,
    }),
  ])

const TopicPage = ({
  topic,
  topics,
  articles,
  resources,
  options,
} /*: {
  topic: Topic,
  topics: Topic[],
  articles: Resource[],
  resources: Resource[],
  options: Object,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: topic.name, options }),
    h(Body, { topic, topics, articles, options, topMenu: true }, [
      h(Topic, { topic, topics, articles, resources, options }),
    ]),
  ])

module.exports = TopicPage
