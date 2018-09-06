// @flow

const h = require('react-hyperscript')
const { prefixUrl, getSearchUrl } = require('./layout')

module.exports = ({
  logoColor,
  options,
 }) =>
  h('div.search-toggle', {}, [
    h('input.search-field', {
      placeholder: "Rechercher dans l'atlas",
      'data-search-page-url': getSearchUrl({}, options),
    }),
    h('button.search-toggle-button', { type: 'button' },
      [
        h('img.if-not-scrolled', {
          alt: '',
          src: prefixUrl(`/assets/img/search-${logoColor}.svg`, options.preview),
        }),
        h('img.if-scrolled', {
          alt: '',
          src: prefixUrl('/assets/img/search-black.svg', options.preview),
        }),
      ],
    ),
  ])
