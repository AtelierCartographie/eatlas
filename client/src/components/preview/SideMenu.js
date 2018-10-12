// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T } = require('react-intl')
const {
  resourcesTypes,
  aPropos,
  getTopicPageUrl,
  prefixUrl,
} = require('./layout')
const LangSelector = require('./LangSelector')

const Topics = ({ topics, options }) =>
  h(
    'ul.nav.navmenu-nav',
    topics.map((t, i) =>
      h('li', { key: t.id }, [
        h('a', { href: getTopicPageUrl(t, options) }, [
          t.id !== '0' && `${t.id}. `,
          t.name,
        ]),
      ]),
    ),
  )

const Resources = ({ options }) =>
  h(
    'ul.nav.navmenu-nav',
    resourcesTypes.map((r, i) =>
      h(
        'li',
        { key: i },
        h('a', { href: r.url(options) }, h(T, { id: r.text })),
      ),
    ),
  )

const APropos = ({ options }) =>
  h(
    'ul.nav.navmenu-nav',
    aPropos.map((r, i) =>
      h('li', { key: i }, [
        h('a', { href: r.url(options) }, h(T, { id: r.text })),
      ]),
    ),
  )

exports.SideMenu = (
  { topics, options } /*: {
  topics: Topic[],
  options: Object,
} */,
) =>
  h(
    'nav#navmenu.navmenu.navmenu-default.navmenu-fixed-left.offcanvas',
    { role: 'navigation' },
    [
      h('a.close-button', '#', '⨯'),
      h('h1.navmenu-title', [
        h(
          'a',
          {
            href: options.preview
              ? `${options.apiUrl || ''}/preview`
              : prefixUrl('/'),
          },
          h(T, { id: 'fo.title' }),
        ),
      ]),
      options.hideLangSelector ? null : h(LangSelector, { options }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-summary' })),
      h(Topics, { topics, options }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-resources' })),
      h(Resources, { options }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-about' })),
      h(APropos, { options }),
    ],
  )

exports.SideMenuToggle = (
  {
    logoColor,
    options,
  } /*: {
  logoColor: 'black' | 'white',
  options: Object,
 } */,
) =>
  h('div.navbar.SideMenuToggle', [
    h(
      'button.navbar-toggle',
      {
        type: 'button',
        'data-toggle': 'offcanvas',
        'data-target': '#navmenu',
      },
      [
        h('img.if-not-scrolled', {
          alt: 'Menu',
          src: prefixUrl(
            `/assets/img/picto-menu-B-${logoColor}.svg`,
            options.preview,
          ),
        }),
        h('img.if-scrolled', {
          alt: 'Menu',
          src: prefixUrl('/assets/img/picto-menu-B-black.svg', options.preview),
        }),
      ],
    ),
  ])
