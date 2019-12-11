// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const { prefixUrl, getSearchUrl } = require('./layout')

module.exports = injectIntl(({ logoColor, open = false, options, intl }) =>
  h(
    `form#top-search-form${open ? '' : '.search-toggle'}.navmenu-form`,
    { role: 'search', action: getSearchUrl({}, options) },
    [
      h('input.search-field', {
        placeholder: intl.formatMessage({ id: 'fo.search.placeholder' }),
        'aria-label': intl.formatMessage({ id: 'fo.search.label' }),
        'data-search-page-url': getSearchUrl({}, options),
        name: 'q',
      }),
      h('input', {
        type: 'hidden',
        name: 'locales[]',
        value: intl.lang,
      }),
      open
        ? null
        : h(
            'button.search-toggle-button',
            {
              type: 'button',
              'aria-label': intl.formatMessage({ id: 'fo.search-open' }),
              'aria-controls': 'top-search-form',
              'aria-expanded': 'false',
            },
            [
              h('img.if-not-scrolled', {
                alt: '',
                src: prefixUrl(
                  `/assets/img/search-${logoColor}.svg`,
                  options.preview,
                ),
              }),
              h('img.if-scrolled', {
                alt: '',
                src: prefixUrl('/assets/img/search-black.svg', options.preview),
              }),
            ],
          ),
    ],
  ),
)
