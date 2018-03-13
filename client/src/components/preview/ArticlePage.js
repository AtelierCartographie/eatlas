// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component, Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { Script, Img } = require('./Tags')
const Head = require('./Head')
const Body = require('./Body')
const {
  HOST,
  resourcesTypes,
  aPropos,
  getImageUrl,
  getResource,
} = require('./layout')

let lexiconId

const getDefinition = (definitions, dt) => {
  const search = dt.toLowerCase()
  const found = definitions.find(({ dt }) => dt.toLowerCase() === search)
  if (!found || !found.dd) {
    return 'Definition not found'
  }
  return found.dd
}

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
  const publishedAt = !article.publishedAt
    ? h('.ArticlePublishedAt', 'Non publié')
    : h('.ArticlePublishedAt', [
        'Publié le ',
        h(
          'time',
          { dateTime: article.publishedAt },
          moment(article.publishedAt).format('D MMMM YYYY'),
        ),
      ])
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
      publishedAt,
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
  h('section.container.resume', [
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
    !article.summaries.en
      ? null
      : h('.resume-select', [
          h('ul.nav.nav-pills', { role: 'tablist' }, [
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
        ]),
    h('hr'),
  ])

// first parse lexicon, then footnotes
const ArticleP = ({ p }) => {
  const parseFootnotes = str => {
    const m = str.match(/(.*)\[(\d+)\](.*)/)
    if (!m) return str
    return [
      m[1],
      h('sup', [
        h('a', { id: `note-${m[2]}`, href: `#footnote-${m[2]}` }, `[${m[2]}]`),
      ]),
      m[3],
    ]
  }

  let parts = []
  parts.push(
    p.lexicon.reduce((tail, l) => {
      const [head, _tail] = tail.split(l)
      parts.push(
        head,
        h(
          'a.keyword',
          { href: `#keyword-${++lexiconId}`, 'data-toggle': 'collapse' },
          l,
        ),
      )
      return _tail
    }, p.text),
  )
  parts = parts.map(p => {
    if (typeof p !== 'string') return p
    return h(Fragment, { key: p }, parseFootnotes(p))
  })

  return h('p.container', parts)
}

const ArticleResource = ({ article, resource }) => {
  switch (resource.type) {
    case 'image':
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

    default:
      return null
  }
}

const ArticleNodes = ({ article, resources }) => {
  return article.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', { key: n.id }, n.text)
      case 'p':
        return h(ArticleP, { p: n, key: n.id })
      case 'resource': {
        const resource = getResource(resources, n.id)
        return !resource
          ? null
          : h(ArticleResource, { article, resource, key: n.id })
      }
      default:
        return null
    }
  })
}

const ArticleKeywords = ({ keywords }) => {
  if (!keywords || !keywords.length) return null

  return h('section.container.ArticleKeywords', [
    h('h2', 'Mots-clés'),
    h(
      'ul',
      keywords.map((kw, i) =>
        h('li', { key: i, }, [h('a', { href: 'TODO' }, kw.text)]),
      ),
    ),
  ])
}

const ArticleQuote = ({ article }) => {
  // TODO conf?
  const publication = 'Atlas de la mondialisation'
  const year = 2016
  const url = `${HOST}`

  return h('section.container.article-quote', [
    h('h2', 'Citation'),
    h('blockquote', [
      h('p', [
        h(
          'span',
          `"${
            article.title
          }", ${publication}, ${year}, [en ligne], consulté le `,
        ),
        h('span.consultedAt', moment().format('D MMMM YYYY')),
        h('span', ', URL:'),
        h('br'),
        h('span.articleUrl', url),
      ]),
    ]),
  ])
}

const ArticleFootnotes = ({ footnotes }) => {
  if (!footnotes || !footnotes.length) return null

  return h('section.container.article-footnotes', [
    h('h2', 'Notes'),
    h('ol', [
      footnotes.map((n, k) =>
        h('li', { id: `footnote-${k + 1}`, key: k }, [
          h('a', { href: `#note-${k + 1}` }, '^'),
          n.text,
        ]),
      ),
    ]),
  ])
}

const ArticleSeeAlso = ({ article, resources, options }) => {
  const relateds = article.related
    .map(r => {
      const [articleId] = r.text.split(/\s*-\s*/)
      return getResource(resources, articleId)
    })
    .filter(a => !!a)

  if (!relateds.length) return null

  return h('section.container.article-see-also', [
    h('h2', "Continuer dans l'Atlas"),
    relateds.map(r =>
      h('.col-sm-6', { key: r.id }, [
        h(
          'a.thumbnail',
          {
            href: options.preview ? `/resources/${r.id}/preview` : 'TODO',
          },
          [
            r.imageHeader &&
              h('img', { src: getImageUrl(r.imageHeader, 'large', '1x') }),
            h('h3', r.title),
          ],
        ),
      ]),
    ),
  ])
}

const ArticleFooter = ({ article, resources, options }) =>
  h('footer.footer-article', [
    h(ArticleKeywords, { keywords: article.keywords }),
    h(ArticleQuote, { article }),
    h(ArticleFootnotes, { footnotes: article.footnotes }),
    h(ArticleSeeAlso, { article, resources, options }),
  ])

const ArticleLexicon = ({ article, definitions }) =>
  h(
    'section.article-def',
    article.nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((l, k) =>
        h('.collapse.container', { key: k, id: `keyword-${k + 1}` }, [
          h('dl', [h('dt', l), h('dd', getDefinition(definitions, l))]),
        ]),
      ),
  )

const Article = props =>
  h('article.article.ArticlePage', [
    h(ArticleHeader, props),
    h(ArticleBreadcrumb, props),
    h(ArticleSummaries, props),
    h(ArticleNodes, props),
    h(ArticleFooter, props),
    h(ArticleLexicon, props),
  ])

const NavTopics = () =>
  h('.nav-article-wrapper', [
    h('nav.nav-article', [
      h('a.nav-article-button.nav-article-previous', [
        h('span.nav-article-chap', [h(Img, { src: '/topics/1.svg' }), 'TODO']),
        h('span.nav-article-title', ['TODO (previous article title)']),
      ]),
      h('a.nav-article-button.nav-article-next', [
        h('span.nav-article-chap', [h(Img, { src: '/topics/1.svg' }), 'TODO']),
        h('span.nav-article-title', ['TODO (next article title)']),
      ]),
    ]),
  ])

class ArticlePreview extends Component /*::<{article: Resource, topics: Topic[], definitions: Definition[], resources: Resource[]}>*/ {
  render() {
    lexiconId = 0
    const { article, topics, definitions, resources, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: article.title }),
      h(Body, { topics, options }, [
        h(Article, { article, topics, definitions, resources, options }),
        h(NavTopics),
      ]),
    ])
  }
}

module.exports = ArticlePreview
