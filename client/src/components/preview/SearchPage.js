// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const { CDN, prefixUrl } = require('./layout')
const { LOCALES, topicName } = require('../../universal-utils')
const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')

// helpers

const searchEndpoint = ({
  preview = false,
  apiUrl = process.env.REACT_APP_API_SERVER,
} = {}) => (apiUrl || '') + (preview ? '/preview/_search' : '/search')

/* in the following lodash templates, the `results` and `formData` variable are
 set in /client/public/assets/js/eatlas.js:
results = {
  start: number,
  end: number,
  count: number,
  hits: [ hit ]
}
*/

const hitTextTemplate = (t, lang) => `
  <strong class="search-result-title"><%= hit.title %></strong>
  <% if (hit.language && hit.language !== ${JSON.stringify(lang)}) { %>
    ${Object.keys(LOCALES)
      .map(
        l =>
          `<% if (hit.language === ${JSON.stringify(l)}) { %>${t(
            `common.search-lang-indicator-html.${l}`,
            {},
            '',
          )}<% } %>`,
      )
      .join('')}
  <% } %>
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

const hitPreviewTemplate = () => `
  <img src="<%= hit.preview.url %>" alt="">
`

const countResultsTemplate = t => `
<% if (results.count === 0) {
  %>${t('nb-results-none', { count: 0 })}<%
} else if (results.count === 1) {
  %>${t('nb-results-one', { count: 1 })}<%
} else if (results.count > 1) {
  %>${t('nb-results-many', { count: '<%= results.count %>' })}<%
} %>`

const paginationTemplate = t => `
<div class="row search-page container">
  <% if (results.start > 1) { %>
    <a href="#prev" class="btn search-results-prev" title="${t(
      'page-previous',
    )}">&lt;&lt;</a>
  <% } %>
  <% if (results.start > 1 || results.end < results.count) { %>
    ${t('page-nav', {
      start: '<%= results.start %>',
      end: '<%= results.end %>',
      'nb-results': countResultsTemplate(t),
    })}
  <% } else { %>
    ${countResultsTemplate(t)}
  <% } %>
  <% if (results.end < results.count) { %>
    <a href="#prev" class="btn search-results-next" title="${t(
      'page-next',
    )}">&gt;&gt;</a>
  <% } %>
</div>
<div class="row search-page-a-z container">
  ${[
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ]
    .map(
      letter =>
        `<span class="search-filter-a-z" data-letter="${letter}">${letter}</span>`,
    )
    .join('')}
</div>
`

const resultsTemplate = (t, lang) => `
${paginationTemplate(t)}
<% for (var i=0;i<results.hits.length;i++) { var hit=results.hits[i]; %>
  <% if (hit.url) { %>
    <a class="row search-result" href="<%= hit.url %>" <% if (hit.type === 'reference') { %>target="_blank"<% } %>>
  <% } else { %>
    <div class="row search-result">
  <% } %>
    <% if (!ui.hideSearchResultsType && window.TYPE_LABEL[hit.type]) { %>
      <div class="search-result-type"><%= window.TYPE_LABEL[hit.type] %></div>
    <% } %>
    <% if (hit.preview) { %>
      <div class="search-result-preview col-sm-3">
        ${hitPreviewTemplate(t)}
      </div>
      <div class="search-result-text col-sm-9">
        ${hitTextTemplate(t, lang)}
      </div>
    <% } else { %>
      <div class="search-result-text col-sm-12">
        ${hitTextTemplate(t, lang)}
      </div>
    <% } %>
  <% if (hit.url) { %>
    </a>
  <% } else { %>
    </div>
  <% } %>
<% } %>
`

const filtersToggle = (title, inputs, hidden = false) => {
  const children = [
    h('h2.search-filters-toggle', { 'data-filters-hidden': '1' }, [
      h('span.search-filters-subtitle', title),
      h('span.toggle-expand', '⌄'),
      h('span.toggle-collapse', '⌃'),
    ]),
    h(
      '.search-filters-inputs',
      inputs.map((input, key) =>
        h('label.search-filters-input', { key }, input),
      ),
    ),
  ]
  return hidden
    ? [h('div', { style: { display: 'none' } }, children)]
    : children
}

// sub-components

const SearchFilters = ({ topics, types, locales, keywords, intl }) =>
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
      h('h1.search-filters-title', {}, h(T, { id: 'fo.search.filters-title' })),
      ...filtersToggle(
        intl.formatMessage({ id: 'fo.search.filter-topic' }),
        topics.map(topic => [
          h('label', { key: topic.id }, [
            h('input', {
              type: 'checkbox',
              name: 'topics[]',
              key: 'input',
              value: topic.id,
            }),
            topicName(topic, intl.lang),
          ]),
        ]),
      ),
      /* Disabled filters: keywords (refs #182)
      ...filtersToggle(intl.formatMessage({ id: 'fo.search.filter-keyword' }), [
        h(
          'select.keywords',
          { multiple: true, size: 5, name: 'keywords[]' },
          keywords.map(value => h('option', { value, key: value }, value)),
        ),
      ]),*/
      /* Disabled filters: date (refs #182)
      ...filtersToggle(intl.formatMessage({ id: 'fo.search.filter-date' }), [
        [
          h(
            'span',
            { key: 'label' },
            intl.formatMessage({ id: 'fo.search.filter-date-before' }),
          ),
          h('input', {
            type: 'number',
            name: 'date-max',
            key: 'input',
            placeholder: 2018,
          }),
        ],
        [
          h(
            'span',
            { key: 'label' },
            intl.formatMessage({ id: 'fo.search.filter-date-after' }),
          ),
          h('input', {
            type: 'number',
            name: 'date-min',
            key: 'input',
            placeholder: 2000,
          }),
        ],
      ]),*/
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
      // Note we can't remove this one to keep 'resource' pages
      // If you need to remove it, just hide it
      ...filtersToggle(
        intl.formatMessage({ id: 'fo.search.filter-type' }),
        Object.keys(types).map(type => [
          h('input', {
            type: 'checkbox',
            name: 'types[]',
            key: 'input',
            value: type,
          }),
          h('span', { key: 'label' }, intl.formatMessage({ id: types[type] })),
        ]),
        false, // Removed by #133, but restored by #182
      ),
      // Hidden a-z filter
      h('input', { type: 'hidden', name: 'letter' }),
      // Hidden warning shown in specific case
      h(
        '.search-filters-warning-types',
        { style: { display: 'none' } },
        intl.formatMessage({ id: 'fo.search.filter-type-warning' }),
      ),
      // Reset button - #133
      h('input.reset-filters', { type: 'reset' }),
    ]),
  ])

const Search = ({ topics, types, locales, keywords, options, intl }) =>
  h('article.SearchPage', [
    h('section.container.SearchForm', [
      h(
        'form.search',
        {
          'data-api-url': searchEndpoint(options),
        },
        [
          h('.search-input', [
            h('input', {
              name: 'q',
              placeholder: intl.formatMessage({ id: 'fo.search.placeholder' }),
            }),
            h('button', [
              h('img', {
                alt: '',
                src: prefixUrl(`/assets/img/search-white.svg`, options.preview),
              }),
            ]),
          ]),
          h(SearchFilters, { topics, types, locales, keywords, intl }),
        ],
      ),
    ]),
    // will be populated later
    h('h1.SearchPageTitle.container', [
      `${intl.formatMessage({ id: 'fo.nav-resources' })} > `,
      h('span.SearchPageTitleType'),
    ]),
    h(
      Html,
      {
        component: 'script.results-template',
        type: 'text/html',
        whitelist: 'all',
        noP: true,
      },
      resultsTemplate(
        (id, values = {}, prefix = 'fo.search.') =>
          intl.formatMessage({ id: `${prefix}${id}` }, values),
        intl.lang,
      ),
    ),
    h('section.SearchResults.container', {}, [
      h('strong.search-results-error'),
      h('.search-results-success'),
    ]),
  ])

const SearchPage = injectIntl((
  {
    topics,
    types,
    keywords,
    locales,
    options,
    intl,
  } /*: {
  topics: Topic[],
  types: ?(string[]),
  keywords: string[],
  locales: { Locale: string },
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, {
      title: intl.formatMessage({ id: 'fo.search.title' }),
      options,
      // Not needed as 'keywords' filters have been removed (refs #182)
      // styles: [`${CDN}/selectize.js/0.12.6/css/selectize.default.min.css`],
    }),
    h(
      Body,
      {
        topics,
        options,
        logoColor: 'black',
        // Not needed as 'keywords' filters have been removed (refs #182)
        // scripts: [`${CDN}/selectize.js/0.12.6/js/standalone/selectize.min.js`],
      },
      [
        h(Search, { topics, types, locales, keywords, options, intl }),
        h(
          Html,
          {
            component: 'script',
            whitelist: 'all',
            noP: true,
          },
          `window.SEARCH_PAGE_TITLE=${JSON.stringify({
            article: intl.formatMessage({ id: 'doc.type-plural.article' }),
            focus: intl.formatMessage({ id: 'doc.type-plural.focus' }),
            map: intl.formatMessage({ id: 'doc.type-plural.map' }),
            image: intl.formatMessage({ id: 'doc.type-plural.image+video' }),
            video: intl.formatMessage({ id: 'doc.type-plural.image+video' }),
            'single-definition': intl.formatMessage({
              id: 'doc.type-plural.definition',
            }),
            definition: intl.formatMessage({
              id: 'doc.type-plural.definition',
            }),
            reference: intl.formatMessage({ id: 'doc.type-plural.reference' }),
            all: intl.formatMessage({ id: 'doc.type-plural.all' }),
          })};
        window.TYPE_LABEL=${JSON.stringify(
          Object.keys(types).reduce(
            (dict, type) =>
              Object.assign(dict, {
                [type]: intl.formatMessage({ id: types[type] }),
              }),
            {},
          ),
        )};`,
        ),
      ],
    ),
  ]),
)

module.exports = SearchPage
