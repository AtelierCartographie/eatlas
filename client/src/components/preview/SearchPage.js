// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { prefixUrl } = require('./layout')
const Head = require('./Head')
const Body = require('./Body')

// helpers

const searchEndpoint = ({ preview = false } = {}) =>
  (process.env.REACT_APP_API_SERVER || '') +
  (preview ? '/preview/_search' : '/search')

/* in the following lodash templates, the `results` and `formData` variable are
 set in /client/public/assets/js/eatlas.js:
results = {
  start: number,
  end: number,
  count: number,
  hits: [ hit ]
}
*/

const hitTextTemplate = `
  <strong class="search-result-title"><%= hit.title %></strong>
  <% if (hit.subtitle) { %>
    <span class="search-result-subtitle"><%= hit.subtitle %></span>
  <% } %>
  <% if (hit.type === 'single-definition' || hit.type === 'definition') { %>
    <% if (hit.extra && hit.extra.aliases && hit.extra.aliases.length > 0) { %>
      <em class="search-result-aliases"><%= hit.extra.aliases.join(', ') %></em>
    <% } %>
    <% if (hit.extra && hit.extra.definition) { %>
      <div class="search-result-definition"><%= hit.extra.definition %></div>
    <% } %>
  <% } %>
`

const hitPreviewTemplate = `
  <img src="<%= hit.preview.url %>" alt="">
`

const paginationTemplate = `
<div class="row search-page container">
  <% if (results.start > 1) { %>
    <a href="#prev" class="btn search-results-prev" title="Résultats précédent">&lt;&lt;</a>
  <% } %>
  <% if (results.start > 1 || results.end < results.count) { %>
    <%= results.start %> - <%= results.end %> sur <%= results.count %> résultat<%= results.count > 1 ? 's' : '' %>
  <% } else { %>
    <%= results.count %> résultat<%= results.count > 1 ? 's' : '' %>
  <% } %>
  <% if (results.end < results.count) { %>
    <a href="#prev" class="btn search-results-next" title="Résultats suivant">&gt;&gt;</a>
  <% } %>
</div>
`

const resultsTemplate = () => `
${paginationTemplate}
<% _.forEach(results.hits, function (hit) { %>
  <% if (hit.url) { %>
    <a class="row search-result" href="<%= hit.url %>" <% if (hit.type === 'reference') { %>target="_blank"<% } %>>
  <% } else { %>
    <div class="row search-result">
  <% } %>
    <% if (!ui.hideSearchResultsType) { %>
      <div class="search-result-type"><%= hit.typeLabel %></div>
    <% } %>
    <% if (hit.preview) { %>
      <div class="search-result-preview col-sm-3">
        ${hitPreviewTemplate}
      </div>
      <div class="search-result-text col-sm-9">
        ${hitTextTemplate}
      </div>
    <% } else { %>
      <div class="search-result-text col-sm-12">
        ${hitTextTemplate}
      </div>
    <% } %>
  <% if (hit.url) { %>
    </a>
  <% } else { %>
    </div>
  <% } %>
<% }) %>
`

const filtersToggle = (title, inputs) => [
  h('h2.search-filters-toggle', { 'data-filters-hidden': '1' }, [
    h('span.search-filters-subtitle', title),
    h('span.toggle-expand', '⌄'),
    h('span.toggle-collapse', '⌃'),
  ]),
  h(
    '.search-filters-inputs',
    inputs.map((input, key) => h('label.search-filters-input', { key }, input)),
  ),
]

// sub-components

const SearchFilters = ({ topics, types, locales, keywords }) =>
  h('.btn-group.search-filters-container', [
    h(
      'button.btn.btn-default.dropdown-toggle',
      {
        type: 'button',
        'data-toggle': 'dropdown',
        'aria-haspopup': 'true',
        'aria-expanded': 'false',
      },
      ['Filtrer', h('span.SearchFiltersCount'), h('span.caret')],
    ),
    h('.search-filters.dropdown-menu', [
      h('h1.search-filters-title', 'Affiner la recherche'),
      ...filtersToggle(
        'Rubriques',
        topics.map(topic => [
          h('label', { key: topic.id }, [
            h('input', {
              type: 'checkbox',
              name: 'topics[]',
              key: 'input',
              value: topic.id,
            }),
            topic.name,
          ]),
        ]),
      ),
      ...filtersToggle(
        'Mots-clés',
        [h(
          'select.keywords',
          { multiple: true, size: 5, name: 'keywords[]' },
          keywords.map(value =>
            h('option', { value, key: value }, value)
          ),
        )],
      ),
      ...filtersToggle('Date de publication', [
        [
          h('span', { key: 'label' }, 'Avant…'),
          h('input', {
            type: 'number',
            name: 'date-max',
            key: 'input',
            placeholder: 2018,
          }),
        ],
        [
          h('span', { key: 'label' }, 'Après…'),
          h('input', {
            type: 'number',
            name: 'date-min',
            key: 'input',
            placeholder: 2000,
          }),
        ],
      ]),
      // TODO show this filters in the future - #133
      /*
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
      */
      // TODO removed this filter - #133
      /*
      ...filtersToggle(
        'Type',
        Object.keys(types).map(type => [
          h('input', {
            type: 'checkbox',
            name: 'types[]',
            key: 'types',
            value: type,
          }),
          h('span', { key: 'label' }, types[type]),
        ]),
      ),
      */
      h(
        '.search-filters-warning-types',
        { style: { display: 'none' } },
        'Note : la recherche ne permet pas de combiner les références, définitions, et autres types',
      ),
      h('input.reset-filters', { type: 'reset' }),
    ]),
  ])

const Search = ({ topics, types, locales, keywords, options }) =>
  h('article.SearchPage', [
    h('section.container.SearchForm', [
      h(
        'form.search',
        {
          'data-api-url': searchEndpoint(options),
        },
        [
          h('.search-input', [
            h('input', { name: 'q', placeholder: "Rechercher dans l'atlas" }),
            h('button', [
              h('img', {
                alt: '',
                src: prefixUrl(`/assets/img/search.svg`, options.preview),
              }),
            ]),
          ]),
          h(SearchFilters, { topics, types, locales, keywords }),
        ],
      ),
    ]),
    // will be populated later
    h('h1.SearchPageTitle.container', [
      'Ressources > ',
      h('span.SearchPageTitleType'),
    ]),
    h('script.results-template', {
      type: 'text/html',
      dangerouslySetInnerHTML: {
        __html: resultsTemplate(),
      },
    }),
    h('section.SearchResults.container', {}, [
      h('strong.search-results-error'),
      h('.search-results-success'),
    ]),
  ])

const SearchPage = ({
  topics,
  types,
  keywords,
  locales,
  options,
} /*: {
  topics: Topic[],
  types: ?(string[]),
  keywords: string[],
  locales: { Locale: string },
  options: FrontOptions,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'eAtlas - Recherche', options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Search, { topics, types, locales, keywords, options }),
    ]),
  ])

module.exports = SearchPage
