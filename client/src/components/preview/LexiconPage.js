// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const removeDiacritics = require('diacritics').remove

const { slugify } = require('../../universal-utils')
const { linkInternalDefinitions } = require('./Doc')

const Head = require('./Head')
const Body = require('./Body')

const az = [
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

const Content = ({ definitions, options }) => {
  let prevLetter = null
  const firstLetterId = dt => {
    const firstLetter = removeDiacritics(dt[0].toUpperCase())
    if (firstLetter !== prevLetter) {
      prevLetter = firstLetter
      return 'start-' + firstLetter
    }
    return null
  }
  const disabledLetter = letter =>
    !definitions.some(
      ({ dt }) => removeDiacritics(dt[0].toUpperCase()) === letter,
    )
  return h('article.LexiconPage', [
    h('h1.SearchPageTitle.container', [
      h(T, { id: 'fo.lexicon-title-prefix' }),
      h('span.SearchPageTitleType', {}, h(T, { id: 'fo.lexicon' })),
    ]),
    h('section.SearchResults.container', [
      h('.search-results-success', [
        h(
          '.row.search-page-a-z.container',
          az.map(letter =>
            h(
              `a.search-filter-a-z${disabledLetter(letter) ? '.disabled' : ''}`,
              { key: letter, href: '#start-' + letter },
              letter,
            ),
          ),
        ),
        definitions.map(({ dt, dd, aliases, lexicon }) =>
          h('.row.search-result', { key: dt, id: slugify(dt) }, [
            h('.search-result-text.col-sm-12', [
              h('strong.search-result-title', {}, [
                h('a.definition-anchor', { name: firstLetterId(dt) }, ''),
                dt,
              ]),
              aliases && aliases.length
                ? h('.search-result-aliases', aliases.join(', '))
                : null,
              h(
                '.search-result-definition',
                linkInternalDefinitions({ dd, lexicon }, definitions),
              ),
              h('button.search-result-definition-toggler', [
                h(
                  'span.search-result-definition-toggler-label-expand',
                  {},
                  h(T, { id: 'fo.search.show-more' }),
                ),
                h(
                  'span.search-result-definition-toggler-label-collapse',
                  { style: { display: 'none', 'aria-hidden': true } },
                  h(T, { id: 'fo.search.show-less' }),
                ),
              ]),
            ]),
          ]),
        ),
      ]),
    ]),
  ])
}

const SearchPage = injectIntl((
  {
    topics,
    options,
    definitions,
    intl,
  } /*: {
  topics: Topic[],
  options: FrontOptions,
  definitions: { dt: string, dd: string, aliases: string[] }[],
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: intl.formatMessage({ id: 'fo.lexicon' }), options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Content, { definitions, options }),
    ]),
  ]),
)

module.exports = SearchPage
