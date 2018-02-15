// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const HOST = 'http://localhost:3000'
let lexiconId

const resourcesTypes = [
  'Cartes et diagrammes',
  'Photos et vidéos',
  'Focus',
  'Lexique',
  'Références',
]

const aPropos = [
  'Qui somme nous ?',
  'Nous contacter',
  'Mentions légales',
  'Plan du site',
]

const srcset = (id, size) => `
  ${HOST}/media/images/${id}-${size}-1x.png,
  ${HOST}/media/images/${id}-${size}@2x.png 2x,
  ${HOST}/media/images/${id}-${size}@3x.png 3x
`

// TODO correctly inject host
const Img = ({ className, alt, src }) =>
  h('img', { className, alt, src: `${HOST}${src}` })

// TODO correctly inject host
const Script = ({ src }) => h('script', { src: `${HOST}${src}` })

// TODO correctly inject host
const StyleSheet = ({ href }) =>
  h('link', { rel: 'stylesheet', href: `${HOST}${href}` })

const ArticleTitle = ({ article }) => {
  const title = article.metas.find(m => m.type === 'title')
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
  return h('header.headerwrap', [
    h('div.container.header-info', [h('h1', title.text), h('br'), publishedAt]),
  ])
}

const ArticleBreadcrumb = ({ article, topics }) => {
  const topic = topics.find(x => x.id === article.topic)
  return h('section.breadcrumb', [
    h('div.container', [h('a', { href: '#' }, topic.name)]),
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

const ArticleP = ({ p }) => {
  const parts = []
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
  return h('p.container', parts)
}

const ArticleResource = ({ article, resource }) => {
  switch (resource.type) {
    case 'image':
      const rid = resource.id + '-image'
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('picture', [
          h('source', {
            srcSet: srcset(rid, 'medium'),
            media: '(min-width: 560px)',
          }),
          h('source', { srcSet: srcset(rid, 'small') }),
          h('img.img-responsive', { srcSet: srcset(rid, 'small') }),
        ]),
        h('figcaption', resource.description),
        h('a.btn.btn-figComment', 'Commentaire'),
        h('div.collapse', 'TODO'),
      ])
      break

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
      break

    case 'sound':
      const url = (process.env.REACT_APP_PUBLIC_PATH_sound || `${HOST}/media/sounds/`) + resource.file
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('audio', {
          src: url,
          controls: true,
        }),
        h('figcaption', resource.description),
      ])
      break
  }
}

const ArticleNodes = ({ article }) => {
  return article.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', n.text)
      case 'p':
        return h(ArticleP, { p: n })
      case 'resource': {
        const resource = (article.resources || []).find(r => r.id === n.id)
        return !resource ? null : h(ArticleResource, { article, resource })
      }
    }
  })
}

const ArticleKeywords = ({ article }) => {
  const keywords = article.metas.find(m => m.type === 'keywords')
  if (!keywords) return null

  return h('section.container.article-keyword', [
    h('h2', 'Mots-clés'),
    h('p', keywords.list.map(kw => h('a', kw.text))),
  ])
}

const ArticleQuote = () =>
  h('section.container.article-quote', [
    h('h2', 'Citation'),
    h('blockquote', [h('p', 'TODO')]),
  ])

const ArticleNotes = ({ article }) => {
  const notes = article.nodes.find(n => n.type === 'footnotes')
  if (!notes) return null

  return h('section.container.article-ref', [
    h('h2', 'Notes'),
    h('ul', [notes.list.map(n => h('li', n.text))]),
  ])
}

const ArticleSeeAlso = ({ article }) => {
  const seeAlsos = article.metas.find(m => m.type === 'related')
  if (!seeAlsos) return null

  return h('section.container.article-see-also', [
    h('h2', "Continuer dans l'Atlas"),
    seeAlsos.list.map(s =>
      h('div.col-sm-6', [
        h('a.thumbnail', { href: '#' }, [
          h(Img, { src: '/assets/img/thumbnails-article1.svg' }),
          h('h3', s.text),
        ]),
      ]),
    ),
  ])
}

const ArticleFooter = props =>
  h('footer.footer-article', [
    h(ArticleKeywords, props),
    h(ArticleQuote, props),
    h(ArticleNotes, props),
    h(ArticleSeeAlso, props),
  ])

const ArticleLexicon = ({ article }) => {
  return h(
    'section.article-def',
    article.nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((l, k) =>
        h('div.collapse.container', { id: `keyword-${k + 1}` }, [
          h('dl', [h('dt', l), h('dd', 'TODO')]),
        ]),
      ),
  )
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

const Head = ({ article }) => {
  const title = article.metas.find(m => m.type === 'title')
  return h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', `${title.text} - eAtlas`),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css',
    }),
    h(StyleSheet, { href: '/assets/css/main-v3.css' }),
    h(StyleSheet, { href: '/assets/css/nav.css' }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,700,700i',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Gentium+Basic:400,400i,700,700i',
    }),
  ])
}

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
    topics.map(t =>
      h('li', [
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
      resourcesTypes.map(a => h('li', [h('a', a)])),
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
    h('ul.dropdown-menu.navmenu-nav', aPropos.map(a => h('li', [h('a', a)]))),
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
        h('span.nav-article-title', ['TODO']),
      ]),
      h('a.nav-article-button.nav-article-next', [
        h('span.nav-article-chap', [h(Img, { src: '/topics/1.svg' }), 'TODO']),
        h('span.nav-article-title', ['TODO']),
      ]),
    ]),
  ])

const NavFooter = ({ topics }) =>
  h('div.table-content-bg', [
    h('footer.footer-page', [
      h('div.container', [
        h('div.row', [
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'Sommaire'),
            h('nav', [
              h(
                'ul',
                topics.map(t =>
                  h('li', [
                    h('a', [
                      h(Img, { alt: t.name, src: `/topics/${t.id}.svg` }),
                      t.name,
                    ]),
                  ]),
                ),
              ),
            ]),
          ]),
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'Resources'),
            h('nav', [h('ul', resourcesTypes.map(r => h('li', [h('a', r)])))]),
          ]),
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'À propos'),
            h('nav', [h('ul', aPropos.map(a => h('li', [h('a', a)])))]),
          ]),
        ]),
        h('section.row.footer-logo', [
          h('div.col-xs-6.col-sm-4', [
            h('a', [
              h(Img, {
                className: 'img-responsive',
                alt: 'Sciences Po - Atelier de cartographie',
                src: '/assets/img/logo-Atelier-NB.svg',
              }),
            ]),
          ]),
          h('div.col-xs-6.col-sm-4'),
          h('div.col-xs-6.col-sm-4', [
            h('a', [
              h(Img, {
                className: 'img-responsive',
                alt: 'Sciences Po - Bibliothèque',
                src: '/assets/img/logo-Bibli-NB.svg',
              }),
            ]),
          ]),
        ]),
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
    h(NavFooter, props),
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

class ArticlePreview extends Component {
  render() {
    lexiconId = 0
    const { article, topics } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { article }),
      h(Body, { article, topics }),
    ])
  }
}

module.exports = ArticlePreview
