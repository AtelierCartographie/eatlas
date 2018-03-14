// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
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
const { Img } = require('./Tags')
const Head = require('./Head')
const Body = require('./Body')
const { HOST, getImageUrl, getResource } = require('./layout')

const srcset = (image, size) => {
  const image1 = getImageUrl(image, size, '1x')
  const image2 = getImageUrl(image, size, '2x')
  const image3 = getImageUrl(image, size, '3x')
  return [
    image1 ? image1 + ',' : '',
    image2 ? image2 + ' 2x,' : '',
    image3 ? image3 + ' 3x,' : '',
  ].join('\n')
}

// subcomponents

const ArticleHeader = ({ article, resources }) => {
  const imageHeader = getResource(resources, article.imageHeader)
  const imageHeaderUrl = imageHeader && getImageUrl(imageHeader, 'large', '1x')
  const style = imageHeaderUrl
    ? {
        backgroundImage: `url(${imageHeaderUrl})`,
      }
    : {}
  return h('header.ArticleHeader', { style }, [
    h('.container.ArticleHeaderInfo', [
      h('h1.ArticleTitle', article.title),
      h(PublishedAt, { doc: article }),
    ]),
  ])
}

const ArticleBreadcrumb = ({ article, topics, options }) => {
  const topic = topics.find(x => x.id === article.topic)
  return h('section.ArticleBreadcrumb', [
    h('.container', [
      h(
        'a',
        { href: options.preview ? `/topics/${topic.id}/preview` : 'TODO' },
        topic ? topic.name : article.topic,
      ),
    ]),
  ])
}

const ArticleSummaries = ({ article }) =>
  h('section.container.resume.ArticleSummaries', [
    !article.summaries.fr
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
    h('.tab-content', [
      h('.tab-pane.active#french', { role: 'tabpanel', lang: 'fr' }, [
        h('h2.line', 'Résumé'),
        h('p', article.summaries.fr),
      ]),
      !article.summaries.fr
        ? null
        : h('.tab-pane#english', { role: 'tabpanel', lang: 'en' }, [
            h('h2.line', 'Summary'),
            h('p', article.summaries.fr),
          ]),
    ]),
  ])

const ArticleResource = ({ article, resource, options }) => {
  switch (resource.type) {
    case 'image':
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('picture', [
          // Only one size (set to 'large')
          h('source', { srcSet: srcset(resource, 'large') }),
          h('img.img-responsive', { srcSet: srcset(resource, 'large') }),
        ]),
        h('figcaption', resource.description),
        h('a.btn.btn-figComment', 'Commentaire'),
        h('.collapse', 'TODO (image comment)'),
      ])

    case 'map':
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('picture', [
          h('source', {
            srcSet: srcset(resource, 'medium'),
            media: '(min-width: 560px)',
          }),
          h('source', { srcSet: srcset(resource, 'small') }),
          h('img.img-responsive', { srcSet: srcset(resource, 'small') }),
        ]),
        h('figcaption', resource.description),
        h('a.btn.btn-figComment', 'Commentaire'),
        h('.collapse', 'TODO (image comment)'),
      ])

    case 'video':
      const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('iframe', {
          title: resource.title,
          src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
          frameBorder: 0,
          height: 420,
          width: 740,
          allowFullScreen: true,
        }),
        h('figcaption', resource.description),
      ])

    case 'sound':
      const url =
        (process.env.REACT_APP_PUBLIC_PATH_sound || `${HOST}/media/sounds/`) +
        resource.file
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('audio', {
          src: url,
          controls: true,
        }),
        h('figcaption', resource.description),
      ])

    case 'focus':
      return h('.container.ArticleFocus', [
        h('div', [
          h(
            'a',
            {
              href: options.preview ? `/resources/${resource.id}/preview` : '',
            },
            [h('.FocusIcon', 'Focus'), resource.title],
          ),
        ]),
      ])

    default:
      return null
  }
}

const ArticleNodes = ({ article, resources, lexiconId, options }) => {
  return article.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', { key: n.id }, n.text)
      case 'p':
        return h(Paragraph, { p: n, key: n.id, lexiconId })
      case 'resource': {
        const resource = getResource(resources, n.id)
        return !resource
          ? null
          : h(ArticleResource, { article, resource, key: n.id, options })
      }
      default:
        return null
    }
  })
}

const ArticleSeeAlso = ({ article, topics, resources, options }) => {
  const relateds = article.related
    .map(r => {
      const [articleId] = r.text.split(/\s*-\s*/)
      return getResource(resources, articleId)
    })
    .filter(a => !!a)

  if (!relateds.length) return null

  return h('section.container.ArticleSeeAlso', [
    h('h2', "Continuer dans l'Atlas"),
    h(
      'ul',
      relateds.map(r =>
        h('li', { key: r.id }, [
          h(
            'a',
            {
              href: options.preview ? `/resources/${r.id}/preview` : 'TODO',
            },
            [
              h('img', {
                alt: '',
                // TODO small
                style: {
                  backgroundImage:
                    r.imageHeader &&
                    `url(${getImageUrl(r.imageHeader, 'large', '1x')})`,
                },
              }),
              h('div', [
                h(
                  '.ArticleSeeAlsoTopic',
                  (topics.find(x => x.id === r.topic) || {}).name,
                ),
                h('.ArticleSeeAlsoTitle', r.title),
              ]),
            ],
          ),
        ]),
      ),
    ),
  ])
}

const ArticleFooter = ({ article, topics, resources, options }) =>
  h('footer.DocFooter', [
    h(Keywords, { keywords: article.keywords }),
    h(Quote, { doc: article }),
    h(Footnotes, { footnotes: article.footnotes }),
    h(ArticleSeeAlso, { article, topics, resources, options }),
  ])

const Article = props =>
  h('article.article.ArticlePage', [
    h(ArticleHeader, props),
    h(ArticleBreadcrumb, props),
    h(ArticleSummaries, props),
    h(ArticleNodes, props),
    h(ArticleFooter, props),
    h(Lexicon, { nodes: props.article.nodes, definitions: props.definitions }),
  ])

const ArticlePrevNext = () => [
  h('a.nav-article-button.nav-article-previous', [
    h('span.nav-article-topic', [h(Img, { src: '/topics/1.svg' }), 'TODO']),
    h('span.nav-article-title', ['TODO (previous article title)']),
  ]),
  h('a.nav-article-button.nav-article-next', [
    h('span.nav-article-topic', [h(Img, { src: '/topics/1.svg' }), 'TODO']),
    h('span.nav-article-title', ['TODO (next article title)']),
  ]),
]

class ArticlePage extends Component /*::<{article: Resource, topics: Topic[], definitions: Definition[], resources: Resource[]}>*/ {
  render() {
    const { article, topics, definitions, resources, options } = this.props
    // passed by reference between paragraphs
    const lexiconId = {
      id: 0,
    }
    return h('html', { lang: 'fr' }, [
      h(Head, { title: article.title }),
      h(Body, { topics, options }, [
        h(Article, {
          article,
          topics,
          definitions,
          resources,
          lexiconId,
          options,
        }),
        h(ArticlePrevNext),
      ]),
    ])
  }
}

module.exports = ArticlePage
