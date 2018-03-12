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
const Footer = require('./Footer')
const { resourcesTypes, aPropos } = require('./layout')

const HOST = process.env.REACT_APP_PUBLIC_URL || ''

let lexiconId

const getImageUrl = ({ images }, size = 'medium', density = '1x') => {
  const file = images && images[size] && images[size][density]
  return file
    ? `${HOST}${process.env.REACT_APP_PUBLIC_PATH_image || '/'}${file}`
    : null
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

const ArticleTitle = ({ article, resources }) => {
  const publishedAt = !article.publishedAt
    ? null
    : h('p', [
        h('em', [
          'Publié le ',
          h(
            'time',
            { dateTime: article.publishedAt },
            moment(article.publishedAt).format('D MMMM YYYY'),
          ),
        ]),
      ])
  const headerImage = getImageHeader(resources, article)
  const headerImageUrl = headerImage && getImageUrl(headerImage, 'large', '1x')
  const style = headerImageUrl
    ? {
        background: `url(${headerImageUrl}) no-repeat center center`,
      }
    : {}
  return h('header.headerwrap', { style }, [
    h('div.container.header-info', [h('h1', article.title), h('br'), publishedAt]),
  ])
}

const ArticleBreadcrumb = ({ article, topics }) => {
  const topic = topics.find(x => x.id === article.topic)
  return h('section.breadcrumb', [
    h('div.container', [
      h('a', { href: '#' }, topic ? topic.name : article.topic),
    ]),
  ])
}

const ArticleSummary = ({ article }) => {
  const summaries = {
    fr: article.metas.find(m => m.type === 'summary-fr'),
    en: article.metas.find(m => m.type === 'summary-en'),
  }
  return h('section.container.resume', [
    h('div.tab-content', [
      h('div.tab-pane.active#french', { role: 'tabpanel', lang: 'fr' }, [
        h('h2.line', 'Résumé'),
        h('p', summaries.fr.text),
      ]),
      !summaries.en
        ? null
        : h('div.tab-pane#english', { role: 'tabpanel', lang: 'en' }, [
            h('h2.line', 'Summary'),
            h('p', summaries.en.text),
          ]),
    ]),
    !summaries.en
      ? null
      : h('div.resume-select', [
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
}

// first parse lexicon, then footnotes
const ArticleP = ({ p }) => {
  const parseFootNotes = str => {
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
    return h(Fragment, { key: p }, parseFootNotes(p))
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
        h('div.collapse', 'TODO (image comment)'),
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

const ArticleKeywords = ({ article }) => {
  const keywords = article.metas.find(m => m.type === 'keywords')
  if (!keywords) return null

  return h('section.container.article-keyword', [
    h('h2', 'Mots-clés'),
    h('p', keywords.list.map((kw, i) => h('a', { key: i }, kw.text))),
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

const ArticleNotes = ({ article }) => {
  const notes = article.nodes.find(n => n.type === 'footnotes')
  if (!notes) return null

  return h('section.container.article-footnotes', [
    h('h2', 'Notes'),
    h('ol', [
      notes.list.map((n, k) =>
        h('li', { id: `footnote-${k + 1}`, key: k }, [
          h('a', { href: `#note-${k + 1}` }, '^'),
          n.text,
        ]),
      ),
    ]),
  ])
}

const ArticleSeeAlso = ({ article, resources }) => {
  const seeAlsos = article.metas.find(m => m.type === 'related')
  if (!seeAlsos) return null

  const found = seeAlsos.list
    .map(s => getArticleSeeAlsoResource(resources, s.text))
    .filter(({ article }) => !!article)
  if (!found.length) return null

  return h('section.container.article-see-also', [
    h('h2', "Continuer dans l'Atlas"),
    found.map(
      ({ article, image }, i) =>
        article &&
        h('div.col-sm-6', { key: i }, [
          h('a.thumbnail', { href: '#' }, [
            image && h(Img, { src: getImageUrl(image, 'small', '1x') }),
            h('h3', article.title),
          ]),
        ]),
    ),
  ])
}
const getArticleSeeAlsoResource = (resources, text) => {
  const [articleId] = text.split(/\s*-\s*/)
  const article = getResource(resources, articleId)
  let image = null
  if (article) {
    image = getImageHeader(resources, article)
  }
  return { article, image }
}
const getImageHeader = (resources, article) => {
  const meta = article.metas.find(m => m.type === 'image-header')
  return getResource(resources, meta.text)
}

const ArticleFooter = props =>
  h('footer.footer-article', [
    h(ArticleKeywords, props),
    h(ArticleQuote, props),
    h(ArticleNotes, props),
    h(ArticleSeeAlso, props),
  ])

const ArticleLexicon = ({ article, definitions }) => {
  return h(
    'section.article-def',
    article.nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((l, k) =>
        h('div.collapse.container', { key: k, id: `keyword-${k + 1}` }, [
          h('dl', [h('dt', l), h('dd', getDefinition(definitions, l))]),
        ]),
      ),
  )
}

const getResource = (resources, id) => resources.find(r => r.id === id)
const getDefinition = (definitions, dt) => {
  const search = dt.toLowerCase()
  const found = definitions.find(({ dt }) => dt.toLowerCase() === search)
  if (!found || !found.dd) {
    return 'Definition not found'
  }
  return found.dd
}

const Article = props =>
  h('article.article', [
    h(ArticleTitle, props),
    h(ArticleBreadcrumb, props),
    h(ArticleSummary, props),
    h(ArticleNodes, props),
    h(ArticleFooter, props),
    h(ArticleLexicon, props),
  ])

// at the top
const NavBar = () =>
  h('nav.navbar.navbar-default.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: '#' }, [
        h(Img, { alt: 'eatlas logo', src: '/assets/img/logo-atlas-B.svg' }),
      ]),
    ]),
  ])

const NavMenuTopics = ({ topics }) =>
  h(
    'ul.nav.navmenu-nav',
    topics.map((t, i) =>
      h('li', { key: i }, [
        h('a', [h(Img, { alt: t.name, src: `/topics/${t.id}.svg` }), t.name]),
      ]),
    ),
  )

const NavMenuResources = () =>
  h('li.dropdown', [
    h(
      'a.dropdown-toggle menu',
      {
        'data-toggle': 'dropdown',
        role: 'button',
        'aria-haspopup': true,
        'aria-expanded': false,
      },
      ['Ressources', h('span.caret')],
    ),
    h(
      'ul.dropdown-menu.navmenu-nav',
      resourcesTypes.map((a, i) => h('li', { key: i }, [h('a', a)])),
    ),
  ])

const NavMenuAPropos = () =>
  h('li.dropdown', [
    h(
      'a.dropdown-toggle menu',
      {
        'data-toggle': 'dropdown',
        role: 'button',
        'aria-haspopup': true,
        'aria-expanded': false,
      },
      ['À propos', h('span.caret')],
    ),
    h(
      'ul.dropdown-menu.navmenu-nav',
      aPropos.map((a, i) => h('li', { key: i }, [h('a', a)])),
    ),
  ])

// on the left
const NavMenu = props =>
  h(
    'nav#navmenu.navmenu.navmenu-default.navmenu-fixed-left.offcanvas',
    { role: 'navigation' },
    [
      h('form.navmenu-form', [
        h('div.form-group', [
          h('input.form-control', { placeholder: 'Rechercher' }),
        ]),
      ]),
      h('ul.nav.navmenu-nav', [
        h(NavMenuTopics, props),
        h('hr'),
        h(NavMenuResources),
        h(NavMenuAPropos),
        h('hr'),
      ]),
    ],
  )

const NavMenuToggle = () =>
  h('div.navbar.navbar-default.navbar-fixed-top', [
    h(
      'button.navbar-toggle',
      {
        type: 'button',
        'data-toggle': 'offcanvas',
        'data-target': '#navmenu',
        'data-canvas': 'body',
      },
      [h(Img, { alt: 'menu', src: '/assets/img/picto-menu-B.svg' })],
    ),
  ])

const NavTopics = () =>
  h('div.nav-article-wrapper', [
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


const Body = props =>
  h('body', [
    h(NavBar),
    h(NavMenu, props),
    h(NavMenuToggle),
    h(Article, props),
    h(NavTopics, props),
    h(Footer, props),
    h('script', {
      src: 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js',
    }),
    h('script', {
      src:
        'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js',
    }),
    h('script', {
      src:
        'https://cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js',
    }),
    h(Script, { src: '/assets/js/eatlas.js' }),
  ])

class ArticlePreview extends Component /*::<{article: Resource, topics: Topic[], definitions: Definition[], resources: Resource[]}>*/ {
  render() {
    lexiconId = 0
    const { article, topics, definitions, resources } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: article.title }),
      h(Body, { article, topics, definitions, resources }),
    ])
  }
}

module.exports = ArticlePreview
