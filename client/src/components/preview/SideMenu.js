// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const {
  resourcesTypes,
  aPropos,
  getTopicPageUrl,
  prefixUrl,
  globalPageUrl,
} = require('./layout')
const { topicName } = require('../../universal-utils')
const LangSelector = require('./LangSelector')
const SearchToggle = require('./SearchBar')

const Topics = ({ topics, options, intl }) =>
  h(
    'ul.nav.navmenu-nav',
    topics.map((t, i) =>
      h('li', { key: t.id }, [
        h('a', { href: getTopicPageUrl(t, options) }, [
          t.id !== '0' && `${t.id}. ${topicName(t, intl.lang)}`,
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

exports.SideMenu = injectIntl((
  {
    logoColor,
    topics,
    options,
    intl,
  } /*: {
  topics: Topic[],
  options: Object,
} */,
) =>
  h(
    'nav#navmenu.navmenu.navmenu-default.navmenu-fixed-left.offcanvas',
    {
      role: 'navigation',
      'aria-label': intl.formatMessage({ id: 'doc.nav-title-sidebar' }),
    },
    [
      h('a.close-button', { href: '#' }, '⨯'),
      h('h1.navmenu-title', [
        h(
          'a',
          {
            href: globalPageUrl('index')(options),
          },
          h(T, { id: 'fo.title' }),
        ),
      ]),
      options.hideLangSelector ? null : h(LangSelector, { logoColor, options }),
      options.hideSearchToggle
        ? null
        : h(SearchToggle, { logoColor, open: true, options }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-summary' })),
      h(Topics, { topics, options, intl }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-resources' })),
      h(Resources, { options }),
      h('h1.navmenu-title', {}, h(T, { id: 'fo.nav-about' })),
      h(APropos, { options }),
    ],
  ),
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
        tabIndex: 1,
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
