// @flow

const h = require('react-hyperscript')
const { prefixUrl, getSearchUrl } = require('./layout')

module.exports = ({ options }) =>
  h('div.search-toggle', {}, [
    h('input.search-field', {
      placeholder: "Rechercher dans l'atlas",
      'data-search-page-url': getSearchUrl({}, options),
    }),
    h('button.search-toggle-button', { type: 'button' },
      h('img', {
        alt: '',
        src: prefixUrl('/assets/img/search.svg', options.preview),
      })
    ),
  ])
