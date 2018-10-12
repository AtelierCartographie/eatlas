// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const { prefixUrl } = require('./layout')
const SearchToggle = require('./SearchBar')
const { SideMenuToggle } = require('./SideMenu')

module.exports = injectIntl((
  {
    logoColor,
    options,
    altTitle,
    intl,
  } /*: {
  logoColor: 'black' | 'white',
  options: FrontOptions,
} */,
) =>
  h('nav#topbar.navbar.navbar-static-top.navbar-logo', [
    h('div.container', [
      h(
        'a.navbar-brand.if-not-scrolled',
        {
          href: options.preview
            ? `${options.apiUrl || ''}/preview`
            : prefixUrl('/'),
        },
        [
          h('img', {
            alt: intl.formatMessage({ id: 'fo.homepage' }),
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
              href: options.preview
                ? `${options.apiUrl || ''}/preview`
                : prefixUrl('/'),
            },
            [
              h('img.if-scrolled', {
                alt: intl.formatMessage({ id: 'fo.homepage' }),
                src: prefixUrl(
                  `/assets/img/logo-eatlas-black.svg`,
                  options.preview,
                ),
              }),
            ],
          ),
    ]),
    h(SideMenuToggle, { logoColor, options }),
    h(SearchToggle, { logoColor, options }),
  ]),
)
