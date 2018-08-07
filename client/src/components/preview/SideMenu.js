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
      h('li', { key: t.id }, [
        h(
          'a',
          { href: getTopicPageUrl(t, options) },
          [t.id !== '0' && `${t.id}. `, t.name],
        ),
      ]),
    ),
  )

const Resources = ({ options }) =>
  h(
    'ul.nav.navmenu-nav',
    resourcesTypes.map((r, i) =>
      h('li', { key: i },
        h(
          'a',
          { href: r.url(options.preview) },
          r.text,
        ),
      ),
    ),
  )

const APropos = ({ options }) =>
  h(
    'ul.nav.navmenu-nav',
    aPropos.map((r, i) =>
      h('li', { key: i },
        h(
          'a',
          { href: r.url(options.preview) },
          r.text,
        ),
      ),
    ),
  )

exports.SideMenu = ({
  topics,
  options,
} /*: {
  topics: Topic[],
  options: Object,
} */) =>
  h(
    'nav#navmenu.navmenu.navmenu-default.navmenu-fixed-left.offcanvas',
    { role: 'navigation' },
    [
      h('a.close-button', '#', '⨯'),
      h('h1.navmenu-title', 'Sommaire'),
      h(Topics, { topics, options }),
      h('h1.navmenu-title', 'Ressources'),
      h(Resources, { options }),
      h('h1.navmenu-title', 'À propos'),
      h(APropos, { options }),
    ],
  )

exports.SideMenuToggle = ({ options } /*: { options: Object } */) =>
  h('div.navbar', [
    h(
      'button.navbar-toggle',
      {
        type: 'button',
        'data-toggle': 'offcanvas',
        'data-target': '#navmenu',
      },
      [
        h('img', {
          alt: '',
          src: prefixUrl('/assets/img/picto-menu-B.svg', options.preview),
        }),
      ],
    ),
  ])
