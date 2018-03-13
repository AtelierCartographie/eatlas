// @flow

const h = require('react-hyperscript')
const { Img } = require('./Tags')
const { resourcesTypes, aPropos } = require('./layout')

const Topics = ({ topics, options }) =>
  h(
    'ul.nav.navmenu-nav',
    topics.map((t, i) =>
      h('li', { key: i }, [
        h('a', { href: options.preview ? `/topics/${t.id}/preview` : 'TODO' }, [
          h(Img, { alt: t.name, src: `/topics/${t.id}.svg` }),
          t.name,
        ]),
      ]),
    ),
  )

const Resources = () =>
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

const APropos = () =>
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

exports.TopMenu = ({ topics, options }) =>
  h('.TopMenu', [
    h('ul.container', [h('button', 'Menu'), topics.map(t => h('button', t.id - 1))]),
  ])
