// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')

const HOST = 'http://localhost:3000'

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
  return h('header.headerwrap', [
    h('div.container.header-info', [
      h('h1', title.text),
      h('p', [
        h('em', ['Publié le ', h('time', { dateTime: 'TODO' }, 'TODO')]),
      ]),
    ]),
  ])
}

const ArticleBreadcrumb = () =>
  h('section.breadcrumb', [h('div.container', [h('a', { href: '#' }, 'TODO')])])

const ArticleSummary = ({ article }) => {
  const summary = article.metas.find(m => m.type === 'summary-fr')
  return h('section.container.resume', [
    h('div.tab-content', [
      h('div.tab-pane.active#french', { role: 'tabpanel', lang: 'fr' }, [
        h('h2.line', 'Résumé'),
        h('p', summary.text),
      ]),
      h('div.tab-pane#english', { role: 'tabpanel', lang: 'en' }, [
        h('h2.line', 'Summary'),
        h('p', 'TODO'),
      ]),
    ]),
    h('div.resume-select', [
      h('ul.nav.nav-pills', { role: 'tablist' }, [
        h('li', { role: 'presentation' }, [
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
  ])
}

const ArticleP = ({ p }) => h('p', p.text)

const ArticleDivContainer = ({ container }) => {
  return h(
    'div.container',
    container.map(p => {
      switch (p.type) {
        case 'header':
          return h('h2', p.text)

        case 'p':
          return h(ArticleP, { p })

        default:
          return h('div', 'TODO')
      }
    }),
  )
}

const ArticleFigureContainer = ({ article, container }) => {
  const r = (article.resources || []).find(r => r.id === container[0].id)
  if (!r) return null

  const rid = r.id + '-image'
  return h('figure.container', [
    h('h2', r.title),
    h('picture', [
      h('source', {
        srcSet: srcset(rid, 'medium'),
        media: '(min-width: 560px)',
      }),
      h('source', { srcSet: srcset(rid, 'small') }),
      h('img.img-responsive', { srcSet: srcset(rid, 'small') }),
    ]),
    h('figcaption', 'TODO'),
    h('a.btn.btn-figComment', 'Commentaire'),
    h('div.collapse', 'TODO'),
  ])
}

const ArticleContainers = ({ article }) => {
  const containers = []
  let container = []
  article.nodes.forEach(n => {
    if (n.type === 'header' || n.type === 'resource') {
      containers.push(container)
      container = []
      container.type = n.type
    }
    container.push(n)
  })

  return containers.filter(c => c.type).map(c => {
    switch (c.type) {
      case 'header':
        return h(ArticleDivContainer, { container: c })
      case 'resource':
        return h(ArticleFigureContainer, { article, container: c })
    }
  })
}

const ArticleKeywords = ({ article }) => {
  const keywords = article.metas.find(m => m.type === 'keywords')
  if (!keywords) return null

  return h('section.container.article-keyword', [
    h('h2', 'Mots-clés'),
    keywords.list.map(kw => h('a', kw.text)),
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
        h('a', [
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

const ArticleLexicon = () => h('section.article-def')

const Article = props =>
  h('article.article', [
    h(ArticleTitle, props),
    h(ArticleBreadcrumb, props),
    h(ArticleSummary, props),
    h(ArticleContainers, props),
    h(ArticleFooter, props),
    h(ArticleLexicon, props),
  ])

const Head = () =>
  h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', 'TODO'),
    h(StyleSheet, { href: '/assets/css/bootstrap.min.css' }),
    h(StyleSheet, { href: '/assets/css/jasny-bootstrap.min.css' }),
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

// at the top
const NavBar = () =>
  h('nav.navbar.navbar-default.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: '#' }, [
        h(Img, { alt: 'eatlas logo', src: '/assets/img/logo-atlas-B.svg' }),
      ]),
    ]),
  ])

const NavMenuTopics = () => h('ul.nav.navmenu-nav', 'TODO')

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
const NavMenu = () =>
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
        h(NavMenuTopics),
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

// TODO left and right arrows
const NavTopics = () => h('div.nav-article-wrapper')

const NavFooter = ({ topics }) =>
  h('div.table-content-bg', [
    h('footer.footer-page', [
      h('div.container', [
        h('div.row', [
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'Sommaire'),
            h('nav', [h('ul', topics.map(t => h('li', [h('a', t)])))]),
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
    h(Script, { src: '/assets/js/bootstrap.min.js' }),
    h(Script, { src: '/assets/js/jasny-bootstrap.min.js' }),
  ])

class ArticlePreview extends Component {
  render() {
    const { article, topics } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { article }),
      h(Body, { article, topics }),
    ])
  }
}

module.exports = ArticlePreview
