// @flow

const h = require('react-hyperscript')
const {
  resourcesTypes,
  aPropos,
  getTopicPageUrl,
  prefixUrl,
} = require('./layout')

const Topics = ({ topics, options }) =>
  h(
    'ul.nav.navmenu-nav',
    topics.map((t, i) =>
      h('li', { key: i }, [
        h('a', { href: getTopicPageUrl(t, options) }, `${t.id}. ${t.name}`),
      ]),
    ),
  )

const Resources = ({ options }) =>
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
      resourcesTypes.map((a, i) =>
        h('li', { key: i }, [h('a', { href: a.url(options.preview) }, a.text)]),
      ),
    ),
  ])

const APropos = ({ options }) =>
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
      aPropos.map((a, i) =>
        h('li', { key: i }, [h('a', { href: a.url(options.preview) }, a.text)]),
      ),
    ),
  ])

exports.SideMenu = (
  { topics, options } /*: { topics: Topic[], options: Object } */,
) =>
  h(
    'nav#navmenu.navmenu.navmenu-default.navmenu-fixed-left.offcanvas',
    { role: 'navigation' },
    [
      h('form.navmenu-form', [
        h('div.form-group', [
          h('input.form-control', {
            placeholder: 'Rechercher',
            'data-search-page-url': options.preview ? '/preview/search' : '',
          }),
        ]),
      ]),
      h('ul.nav.navmenu-nav', [
        h(Topics, { topics, options }),
        h('hr'),
        h(Resources, { options }),
        h(APropos, { options }),
        h('hr'),
      ]),
    ],
  )

exports.SideMenuToggle = ({ options } /*: { options: Object } */) =>
  h('div.navbar.navbar-default.navbar-fixed-top', [
    h(
      'button.navbar-toggle',
      {
        type: 'button',
        'data-toggle': 'offcanvas',
        'data-target': '#navmenu',
        'data-canvas': 'body',
      },
      [
        h('img', {
          alt: '',
          src: prefixUrl('/assets/img/picto-menu-B.svg', options.preview),
        }),
      ],
    ),
  ])
