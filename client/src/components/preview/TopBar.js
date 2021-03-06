// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const { prefixUrl, globalPageUrl } = require('./layout')
const SearchToggle = require('./SearchBar')
const LangSelector = require('./LangSelector')
const { SideMenuToggle } = require('./SideMenu')

module.exports = injectIntl((
  {
    logoColor,
    options,
    altTitle,
    linkContent,
    intl,
  } /*: {
  logoColor: 'black' | 'white',
  options: FrontOptions,
} */,
) =>
  h(
    'nav#topbar.navbar.navbar-static-top.navbar-logo',
    {
      role: 'navigation',
      'aria-label': intl.formatMessage({ id: 'doc.nav-title-topbar' }),
    },
    [
      h('div.container', [
        h(
          'a.navbar-brand.if-not-scrolled',
          {
            href: globalPageUrl('index')(options),
          },
          [
            h('img', {
              alt: intl.formatMessage(
                {
                  id: 'fo.topbar-logo-title',
                },
                {
                  title: intl.formatMessage({
                    id: 'fo.title',
                  }),
                },
              ),
              src: prefixUrl(
                `/assets/img/logo-eatlas-${logoColor}.svg`,
                options.preview,
              ),
            }),
          ],
        ),
        altTitle
          ? h('a.navbar-brand.if-scrolled', { href: '#' }, altTitle)
          : h(
              'a.navbar-brand.if-scrolled',
              {
                href: globalPageUrl('index')(options),
              },
              [
                h('img.if-scrolled', {
                  alt: intl.formatMessage(
                    {
                      id: 'fo.topbar-logo-title',
                    },
                    {
                      title: intl.formatMessage({
                        id: 'fo.title',
                      }),
                    },
                  ),
                  src: prefixUrl(
                    `/assets/img/logo-eatlas-black.svg`,
                    options.preview,
                  ),
                }),
              ],
            ),
      ]),
      linkContent
        ? h(
            'a#link-to-content',
            { href: linkContent, tabIndex: 1 },
            intl.formatMessage({ id: 'doc.nav-title-goto-content' }),
          )
        : null,
      h(
        'a#link-to-sitemap',
        { href: globalPageUrl('sitemap')(options), tabIndex: 1 },
        intl.formatMessage({ id: 'doc.nav-title-goto-sitemap' }),
      ),
      // h('a#link-to-menu', { href: '#???', tabIndex: 1 }),
      h(SideMenuToggle, { logoColor, options }),
      h('.tools', [
        options.hideLangSelector
          ? null
          : h(LangSelector, { logoColor, options, shortLabel: true }),
        options.hideSearchToggle
          ? null
          : h(SearchToggle, { logoColor, options }),
      ]),
    ],
  ),
)
