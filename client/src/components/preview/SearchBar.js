// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const { prefixUrl, getSearchUrl } = require('./layout')

module.exports = injectIntl(({ logoColor, options, intl }) =>
  h('div.search-toggle', {}, [
    h('input.search-field', {
      placeholder: intl.formatMessage({ id: 'fo.search-placeholder' }),
      'data-search-page-url': getSearchUrl({}, options),
    }),
    h('button.search-toggle-button', { type: 'button' }, [
      h('img.if-not-scrolled', {
        alt: '',
        src: prefixUrl(`/assets/img/search-${logoColor}.svg`, options.preview),
      }),
      h('img.if-scrolled', {
        alt: '',
        src: prefixUrl('/assets/img/search-black.svg', options.preview),
      }),
    ]),
  ]),
)
