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
const { getImageUrl, getResourcePageUrl, getTopicPageUrl } = require('./layout')
const { getMediaUrl } = require('../../universal-utils')

const srcset = (image, size, options) => {
  const image1 = getImageUrl(image, size, '1x', options)
  const image2 = getImageUrl(image, size, '2x', options)
  const image3 = getImageUrl(image, size, '3x', options)
  // TODO: why this map- prefix?
  return [
    image1 ? `${image1.replace('file/', 'file/map-')}',` : '',
    image2 ? `${image2.replace('file/', 'file/map-')} 2x,` : '',
    image3 ? `${image3.replace('file/', 'file/map-')} 3x,` : '',
  ].join('\n')
}

// subcomponents

const ArticleHeader = ({ article, resources, options }) => {
  const imageHeader = resources.find(r => r.id === article.imageHeader)
  const imageHeaderUrl =
    imageHeader && getImageUrl(imageHeader, 'large', '1x', options)

  const style = imageHeaderUrl
    ? {
        backgroundImage: `url(${imageHeaderUrl})`,
      }
    : {}

  return h('header.ArticleHeader', { style }, [
    h(
      '.container.ArticleHeaderInfo',
      { className: `title-position-${article.titlePosition}` },
      [h('h1.ArticleTitle', article.title), h(PublishedAt, { doc: article })],
    ),
  ])
}

const ArticleBreadcrumb = ({ article, topics, options }) => {
  const topic = topics.find(x => x.id === article.topic)
  return h('section.ArticleBreadcrumb', [
    h('.container', [
      h(
        'a',
        { href: getTopicPageUrl(topic, options) },
        topic ? `${topic.id}. ${topic.name}` : article.topic,
      ),
    ]),
  ])
}

// french and english (optional)
const ArticleSummaries = ({ article }) =>
  h('section.container.resume.ArticleSummaries', [
    !article.summaries.en
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
      !article.summaries.en
        ? null
        : h('.tab-pane#english', { role: 'tabpanel', lang: 'en' }, [
            h('h2.line', 'Summary'),
            h('p', article.summaries.en),
          ]),
    ]),
  ])

const ArticleResource = ({ resource, options, topics }) => {
  switch (resource.type) {
    case 'image':
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('picture', [
          // Only one size (set to 'large')
          h('source', {
            srcSet: srcset(resource, 'large', options),
          }),
          h('img.img-responsive', {
            srcSet: srcset(resource, 'large', options),
          }),
        ]),
        h('figcaption', resource.copyright),
        h('.ArticleResourceDownload', 'Info & téléchargement'),
        h(ArticleResourceComment, { resource }),
      ])

    case 'map':
      return h('figure', [
        h('h2.figure-title.container', resource.title),
        h('picture', [
          h('source', {
            srcSet: srcset(resource, 'large', options),
            media: '(min-width: 700px)',
          }),
          h('source', {
            srcSet: srcset(resource, 'medium', options),
            media: '(min-width: 560px)',
          }),
          h('source', {
            srcSet: srcset(resource, 'small', options),
          }),
          h('img', {
            srcSet: srcset(resource, 'small', options),
          }),
        ]),
        h('figcaption.container', resource.copyright),
        h('.ArticleResourceDownload.container', 'Info & téléchargement'),
        h(ArticleResourceComment, { resource }),
      ])

    case 'video': {
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
    }

    case 'sound': {
      const url = getMediaUrl(resource.file)
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('audio', {
          src: url,
          controls: true,
        }),
        h('figcaption', resource.description),
      ])
    }

    case 'focus':
      return h('.container.ArticleFocus', [
        h('div', [
          h(
            'a',
            {
              href: getResourcePageUrl(resource, options),
            },
            [h('.FocusIcon', 'Focus'), resource.title],
          ),
        ]),
      ])

    default:
      return null
  }
}

const ArticleResourceComment = ({ resource }) => {
  if (!resource.description) return null
  const id = `comment-${resource.id}`
  return h('.ArticleResourceComment.container', [
    h(
      'a',
      {
        href: `#${id}`,
        'data-toggle': 'collapse',
        role: 'button',
        'aria-controls': id,
        'aria-expanded': false,
        'aria-haspopup': true,
      },
      'Commentaire',
    ),
    h('.collapse', { id }, [h('div', resource.description)]),
  ])
}

const ArticleNodes = ({ article, resources, lexiconId, options, topics }) => {
  return article.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', { key: n.id }, n.text)
      case 'p':
        return h(Paragraph, { p: n, key: n.id, lexiconId })
      case 'resource': {
        const resource = resources.find(r => r.id === n.id)
        return !resource
          ? null
          : h(ArticleResource, {
              article,
              resource,
              key: n.id,
              options,
              topics,
            })
      }
      default:
        return null
    }
  })
}

const ArticleSeeAlso = ({ article, topics, resources, options }) => {
  // used by SeeAlso
  const relateds = article.related
    .map(r => {
      const [articleId] = r.text.split(/\s*-\s*/)
      return resources.find(r => r.id === articleId)
    })
    .filter(a => !!a)

  if (!relateds || !relateds.length) return null

  return h('section.container.ArticleSeeAlso', [
    h('h2', "Continuer dans l'Atlas"),
    h(
      'ul',
      relateds.map(r =>
        h('li', { key: r.id }, [
          h(
            'a',
            {
              href: getResourcePageUrl(r, options),
            },
            [
              h('img', {
                alt: '',
                // TODO densities
                style: {
                  backgroundImage:
                    r.imageHeader &&
                    `url(${getImageUrl(r.imageHeader, 'small', '1x', options) ||
                      getImageUrl(r.imageHeader, 'medium', '1x', options) ||
                      getImageUrl(r.imageHeader, 'large', '1x', options)})`,
                },
              }),
              h('div', [
                h(
                  '.ArticleSeeAlsoTopic',
                  (topics.find(t => t.id === r.topic) || {}).name,
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
    h(Keywords, { keywords: article.keywords, options }),
    h(Quote, { doc: article }),
    h(Footnotes, {
      references: article.references,
      footnotes: article.footnotes,
    }),
    h(ArticleSeeAlso, { article, topics, resources, options }),
  ])

const Article = props =>
  h('article.article.ArticlePage', [
    h(ArticleHeader, props),
    h(ArticleBreadcrumb, props),
    h(ArticleSummaries, props),
    h(ArticleNodes, props),
    h(ArticlePrevNextInline, props),
    h(ArticleFooter, props),
    h(Lexicon, { nodes: props.article.nodes, definitions: props.definitions }),
  ])

// floating buttons on each side of the screen
// use *all* the articles of the site
const ArticlePrevNext = ({ article, articles, topics, options }) => {
  if (!articles || !articles.length) return null
  const currentIndex = articles.findIndex(a => a.id === article.id)
  const prevIndex = currentIndex !== 0 ? currentIndex - 1 : null
  const nextIndex =
    currentIndex !== articles.length - 1 ? currentIndex + 1 : null
  const prev = articles[prevIndex]
  const next = articles[nextIndex]

  return [
    prev &&
      h('a.ArticlePrev', { href: getResourcePageUrl(prev, options) }, [
        h('span.ArticlePrevNextTopic', [
          (topics.find(t => t.id === prev.topic) || {}).name,
        ]),
        h('span.ArticlePrevNextTitle', prev.title),
      ]),
    next &&
      h('a.ArticleNext', { href: getResourcePageUrl(next, options) }, [
        h('span.ArticlePrevNextTopic', [
          (topics.find(t => t.id === next.topic) || {}).name,
        ]),
        h('span.ArticlePrevNextTitle', next.title),
      ]),
    // horrible pattern? yes? no? who knows?
    h('script', {
      dangerouslySetInnerHTML: {
        __html: `
window.addEventListener('DOMContentLoaded', () => {
  const toggle = (sel, bool) => {
    const el = document.querySelector(sel)
    if (el) el.classList.toggle('hidden', bool)
  }
  const observer = new IntersectionObserver((entries) => {
    const hidden = entries[0].isIntersecting
    toggle('.ArticlePrev', hidden)
    toggle('.ArticleNext', hidden)
  })
  observer.observe(document.querySelector('.ArticleHeader'))
  observer.observe(document.querySelector('.DocFooter'))
})
`,
      },
    }),
  ]
}

// these buttons appear just above the footer
const ArticlePrevNextInline = ({ article, articles, topics, options }) => {
  if (!articles || !articles.length) return null
  const currentIndex = articles.findIndex(a => a.id === article.id)
  const prevIndex = currentIndex !== 0 ? currentIndex - 1 : null
  const nextIndex =
    currentIndex !== articles.length - 1 ? currentIndex + 1 : null
  let prev = articles[prevIndex]
  const next = articles[nextIndex]

  return h('.ArticlePrevNextInline.container', [
    prev &&
      h('.ArticlePrevWrapperInline', [
        h('a.ArticlePrevInline', { href: getResourcePageUrl(prev, options) }, [
          h('img', {
            alt: '',
            // TODO densities
            style: {
              backgroundImage:
                prev.imageHeader &&
                `url(${getImageUrl(prev.imageHeader, 'large', '1x', options)})`,
            },
          }),
          h('div', [
            h('.ArticlePrevNextTopicInline', [
              (topics.find(t => t.id === prev.topic) || {}).name,
            ]),
            h('.ArticlePrevNextTitleInline', prev.title),
          ]),
        ]),
      ]),
    next &&
      h('.ArticleNextWrapperInline', [
        h('a.ArticleNextInline', { href: getResourcePageUrl(next, options) }, [
          h('div', [
            h('.ArticlePrevNextTopicInline', [
              (topics.find(t => t.id === next.topic) || {}).name,
            ]),
            h('.ArticlePrevNextTitleInline', next.title),
          ]),
          h('img', {
            alt: '',
            // TODO densities
            style: {
              backgroundImage:
                next.imageHeader &&
                `url(${getImageUrl(next.imageHeader, 'large', '1x', options)})`,
            },
          }),
        ]),
      ]),
  ])
}

const ArticlePage = (
  {
    article,
    articles,
    topics,
    definitions,
    resources,
    options,
  } /*:{article: Resource, articles: Resource[], topics: Topic[], definitions: Definition[], resources: Resource[], options: Object }*/,
) => {
  // passed by reference between paragraphs
  const lexiconId = {
    id: 0,
  }

  return h('html', { lang: 'fr' }, [
    h(Head, { title: article.title, options }),
    h(Body, { topics, options, sideMenu: true }, [
      h(Article, {
        article,
        articles,
        topics,
        definitions,
        resources,
        lexiconId,
        options,
      }),
      h(ArticlePrevNext, { article, articles, topics, options }),
    ]),
  ])
}

module.exports = ArticlePage
