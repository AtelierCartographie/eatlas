// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { Img } = require('./Tags')
const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const filtersToggle = (title, inputs) => [
  h('.row.search-filters-subtitle', title),
  h(
    '.container.search-filters-inputs',
    inputs.map((input, key) =>
      h('label.row.search-filters-input', { key }, input),
    ),
  ),
]

const Search = ({ topics, types, locales, keywords }) => {
  return h('article.SearchPage', [
    h('section.container.SearchForm', [
      h('form.search', [
        h('.row.search-input', [
          h('input', { placeholder: "Rechercher dans l'atlas" }),
          h('button', [h(Img, { alt: '', src: `/assets/img/search.svg` })]),
        ]),
        h('.search-filters', [
          h('.container', [
            h('.row.search-filters-title', 'Affiner la recherche'),
            ...filtersToggle(
              'Chapitre',
              topics.map(topic => [
                h('input', {
                  type: 'checkbox',
                  name: 'topics[]',
                  key: 'input',
                  value: topic.id,
                }),
                h('span', { key: 'label' }, topic.name),
              ]),
            ),
            ...filtersToggle(
              'Mots-clés',
              keywords.map(keyword => [
                h('input', {
                  type: 'checkbox',
                  name: 'keywords[]',
                  key: 'input',
                  value: keyword,
                }),
                h('span', { key: 'label' }, keyword),
              ]),
            ),
            ...filtersToggle('Date de publication', [
              [
                h('span', { key: 'label' }, 'Avant le…'),
                h('input', { type: 'date', name: 'date-max', key: 'input' }),
              ],
              [
                h('span', { key: 'label' }, 'Après le…'),
                h('input', { type: 'date', name: 'date-min', key: 'input' }),
              ],
            ]),
            ...filtersToggle(
              'Langue',
              Object.keys(locales).map(locale => [
                h('input', {
                  type: 'checkbox',
                  name: 'locales[]',
                  key: 'input',
                  value: locale,
                }),
                h('span', { key: 'label' }, locales[locale]),
              ]),
            ),
          ]),
        ]),
      ]),
    ]),
    h('section.SearchResults', [
      // TODO
    ]),
  ])
}

class SearchPage extends Component /*::<{topics: Topic[], articles: Article[], types: ?string[], keywords: string[], locales: { Locale: string } }>*/ {
  render() {
    const { topics, articles, options, types, locales, keywords } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: 'eAtlas - Recherche' }),
      h(
        Body,
        { topics, articles, options, topMenu: true, logoColor: 'white' },
        [h(Search, { topics, types, locales, keywords, options })],
      ),
    ])
  }
}

module.exports = SearchPage