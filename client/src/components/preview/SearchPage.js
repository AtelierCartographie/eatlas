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

// helpers

const ENDPOINT = (process.env.REACT_APP_API_SERVER || '') + '/search'

const hitTextTemplate = `
  <strong><%= hit.title %></strong>
  <% if (hit.subtitle) { %>
    <span><%= hit.subtitle %></span>
  <% } %>
`

const hitPreviewTemplate = `
  <img src="<%= hit.preview.url %>" alt="">
`

const resultsTemplate = ({ showType = true }) => `
<div class="row search-page">
  <% if (results.start > 1 || results.end < results.count) { %>
    <%= results.start %> - <%= results.end %> sur <%= results.count %> résultat<%= results.count > 1 ? 's' : '' %>
  <% } else { %>
    <%= results.count %> résultat<%= results.count > 1 ? 's' : '' %>
  <% } %>
</div>
<% _.forEach(results.hits, function (hit) { %>
  <a class="row search-result" href="<%= hit.url %>">
    ${showType && `<div class="search-result-type"><%= hit.type %></div>`}
    <% if (hit.preview) { %>
      <div class="search-result-preview col-sm-6">
        ${hitPreviewTemplate}
      </div>
      <div class="search-result-text col-sm-6">
        ${hitTextTemplate}
      </div>
    <% } else { %>
      <div class="search-result-text col-sm-12">
        ${hitTextTemplate}
      </div>
    <% } %>
  </a>
<% }) %>
`

const filtersToggle = (title, inputs) => [
  h('.row.search-filters-toggle', { 'data-filters-hidden': '1' }, [
    h('.col-sm-3.search-filters-subtitle', title),
    h('.col-sm-1.toggle-expand', '⌄'),
    h('.col-sm-1.toggle-collapse', '⌃'),
  ]),
  h(
    '.container.search-filters-inputs',
    inputs.map((input, key) =>
      h('label.row.search-filters-input', { key }, input),
    ),
  ),
]

// sub-components

const Search = ({ topics, types, locales, keywords }) => {
  return h('article.SearchPage', [
    h('section.container.SearchForm', [
      h(
        'form.search',
        {
          'data-search-types': types ? JSON.stringify(types) : undefined,
          'data-api-url': ENDPOINT,
        },
        [
          h('.row.search-input', [
            h('input', { name: 'q', placeholder: "Rechercher dans l'atlas" }),
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
                  h('input', {
                    type: 'date',
                    name: 'date-max',
                    key: 'input',
                  }),
                ],
                [
                  h('span', { key: 'label' }, 'Après le…'),
                  h('input', {
                    type: 'date',
                    name: 'date-min',
                    key: 'input',
                  }),
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
        ],
      ),
    ]),
    h('script.results-template', {
      type: 'text/html',
      dangerouslySetInnerHTML: {
        __html: resultsTemplate({ showType: !types }),
      },
    }),
    h('section.SearchResults', {}, [
      h('strong.container.search-results-error'),
      h('.container.search-results-success'),
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
