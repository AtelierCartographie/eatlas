// @flow

// components shared by ArticlePage and FocusPage

const { getSearchUrl, globalPageUrl, getResourcePageUrl } = require('./layout')
const { getDefinition, slugify, stripTags } = require('../../universal-utils')
const { Fragment } = require('react')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const h = require('react-hyperscript')
const moment = require('moment')

const Html = require('./Html')

// spacing info is not kept by the parsing phase
// se we need to emulate basic french typo rules here
const padText = (text, markup, idx) => {
  let prepend = true
  let append = true

  // position
  if (idx === 0) prepend = false
  if (idx === markup.length - 1) append = false

  // punctuation
  if (['.', ',', ')'].includes(text[0])) prepend = false
  if (['('].includes(text[text.length - 1])) append = false

  // siblings
  const next = markup[idx + 1]
  if (next && next.type === 'footnote') append = false

  if (prepend) text = ` ${text}`
  if (append) text = `${text} `
  return text
}

exports.PublishedAt = injectIntl(({ doc, intl } /*: { doc: Resource } */) => {
  const date = doc.visiblePublishedAt || doc.publishedAt
  if (!date) {
    return h('.PublishedAt', {}, h(T, { id: 'article.unpublished' }))
  }
  return h('.PublishedAt', [
    h(T, { id: 'doc.published-at' }),
    ' ',
    h(
      'time',
      { dateTime: moment(date).format('YYYY-MM-DD') },
      moment(date)
        .locale(intl.lang)
        .format(intl.formatMessage({ id: 'doc.date-format' })),
    ),
  ])
})

// used by Paragraphs and Footnotes/References
const renderMarkup = (markup /*: Array<Object> */, intl, lexiconId = {}) => {
  let linkLang = null
  return markup.map((m, idx) => {
    // see doc-parsers/article parseMarkup
    switch (m.type) {
      case 'text': {
        let text = m.text || ''
        const matchLang = text.match(/^\s*\[(EN|FR)\]\s*/i)
        if (matchLang) {
          text = text.replace(matchLang[0], '')
          linkLang = matchLang[1]
        }
        return h(Fragment, { key: idx }, padText(text, markup, idx))
      }

      case 'em':
      case 'strong':
      case 'sup':
        return h(m.type, { key: idx }, m.text)

      case 'link':
        return h(
          'a.external',
          {
            key: idx,
            href: m.url,
            target: '_blank',
            title: `${intl.formatMessage(
              { id: 'fo.link-new-window-title' },
              { title: stripTags(m.text) },
            )}`,
            lang: linkLang,
          },
          m.text,
        )

      case 'lexicon': {
        const id = `lexicon-${++lexiconId.id}`
        return h(
          'a.LexiconLink',
          {
            key: idx,
            href: `#${id}`,
            'data-toggle': 'collapse',
            title: intl.formatMessage(
              { id: 'fo.link-lexicon-title' },
              { text: stripTags(m.text) },
            ),
            'aria-controls': id,
          },
          m.text,
        )
      }

      case 'footnote':
        return h('sup', { key: idx }, [
          h(
            'a.FootnoteLink',
            { id: `note-${m.text}`, href: `#footnote-${m.text}` },
            `[${m.text}]`,
          ),
        ])

      default:
        return null
    }
  })
}

exports.Paragraph = injectIntl((
  { p, lexiconId, intl } /*: {
  p: Object,
  lexiconId: { id: number },
} */,
) => {
  if (!p.markup)
    throw new Error('no markup found. This document needs to be reimported')

  return h('p.container.DocParagraph', renderMarkup(p.markup, intl, lexiconId))
})

exports.Keywords = (
  { keywords, options } /*: {
  keywords: Object,
  options: Object,
} */,
) => {
  if (!keywords || !keywords.length) return null

  return h('section.container.Keywords', [
    h('h2', {}, h(T, { id: 'doc.keywords' })),
    h(
      'ul',
      keywords.map((kw, i) =>
        h('li', { key: i }, [
          h(
            'a',
            {
              href: getSearchUrl({ keywords: [kw.text] }, options),
            },
            kw.text,
          ),
        ]),
      ),
    ),
  ])
}

exports.exportLinks = ({ doc, intl, options }) => {
  const publisher = intl.formatMessage({ id: 'doc.publisher' })
  const year = new Date(
    doc.visiblePublishedAt || doc.publishedAt || Date.now(),
  ).getFullYear()
  const url = getResourcePageUrl(doc, options)

  const bibtex = `@book{eAtlas,
  title={${stripTags(doc.title)}},
  author={${doc.author}},
  url={${url}},
  year={${year}},
  publisher={${publisher}}
}`
  const endnote = `%0 Book
%T ${stripTags(doc.title)}
%A ${doc.author}
%U ${url}
%D ${year}
%I ${publisher}`

  const refman = `TY  - BOOK
T1  - ${doc.title}
A1  - ${doc.author}
UR  - ${url}
Y1  - ${year}
PB  - ${publisher}`

  // TODO: where should export links be available? Ref #128
  return [
    {
      href: `data%3Aapplication/x-bibtex;name=${encodeURIComponent(
        doc.title,
      )}.bibtex,${encodeURIComponent(bibtex)}`,
      title: `${stripTags(doc.title)}.bibtex`,
      type: 'application/x-bibtex',
    },
    {
      href: `data%3Aapplication/x-endnote-refer;name=${encodeURIComponent(
        doc.title,
      )}.enw,${encodeURIComponent(endnote)}`,
      title: `${stripTags(doc.title)}.enw`,
      type: 'application/x-endnote-refer',
    },
    {
      href: `data%3Aapplication/x-research-info-systems;name=${encodeURIComponent(
        doc.title,
      )}.ris,${encodeURIComponent(refman)}`,
      title: `${stripTags(doc.title)}.ris`,
      type: 'application/x-research-info-systems',
    },
  ]
}

exports.Quote = injectIntl(({ doc, intl, options } /*: { doc: Resource } */) =>
  h('section.container.Quote', [
    h('h2', {}, h(T, { id: 'doc.quote-title' })),
    // a11y: not using real blockquote tag as it's not semantically correct
    h('div.blockquote', [
      h('p', [
        h(
          Html,
          { component: 'span' },
          intl.formatMessage(
            { id: 'doc.quote-text' },
            {
              title: stripTags(doc.title),
              publisher: intl.formatMessage({ id: 'doc.publisher' }),
              year: new Date(
                doc.visiblePublishedAt || doc.publishedAt || Date.now(),
              ).getFullYear(),
            },
          ),
        ),
        ' ',
        h(
          'span.consultedAt',
          moment()
            .locale(intl.lang)
            .format(intl.formatMessage({ id: 'doc.date-format' })),
        ),
        h('span', ', URL:'),
        h('br'),
        h('span.articleUrl', getResourcePageUrl(doc, options)),
      ]),
    ]),
  ]),
)

// also called simply 'Notes' or 'Références'
exports.Footnotes = injectIntl((
  {
    references,
    footnotes,
    intl,
  } /*: {
  references: Object[],
  footnotes: Object[],
} */,
) => {
  if ((!references || !references.length) && (!footnotes || !footnotes.length))
    return null

  return h('section.container.Footnotes', [
    h('h2', {}, h(T, { id: 'doc.references' })),
    footnotes &&
      Boolean(footnotes.length) &&
      h(
        'ol',
        footnotes.map((n, k) =>
          h('li', { id: `footnote-${k + 1}`, key: k }, [
            h('a.back', { href: `#note-${k + 1}` }, '^'),
            renderMarkup(n.markup, intl),
          ]),
        ),
      ),
    references &&
      Boolean(references.length) &&
      h(
        'ol',
        references.map((r, k) =>
          h('li', { key: k }, renderMarkup(r.markup, intl)),
        ),
      ),
  ])
})

exports.Lexicon = injectIntl((
  {
    nodes,
    definitions,
    options,
    intl,
  } /*: {
  nodes: Object[],
  definitions: Object[],
  options: Object,
} */,
) =>
  h(
    'section.Lexicon',
    nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((dt, k) => {
        const found = getDefinition(dt, definitions, true)
        return { dt, k, found }
      })
      .map(({ dt, k, found }) => {
        const href = globalPageUrl(
          'definition',
          null,
          slugify(found ? found.dt : dt),
        )(options)
        return h(
          '.collapse.container',
          { key: k, id: `lexicon-${k + 1}`, role: 'dialog' },
          [
            h('dl', [
              h('dt', [
                found && found.dt !== dt
                  ? // Alias
                    h(
                      'a.lexicon-dialog-title',
                      {
                        href,
                        role: 'button',
                        title: intl.formatMessage(
                          { id: 'doc.goto-lexicon-link-title' },
                          { title: dt },
                        ),
                      },
                      [
                        dt,
                        h('span.root-definition-link-title', ` > ${found.dt}`),
                      ],
                    )
                  : // Real definition
                    h(
                      'a.lexicon-dialog-title',
                      {
                        href,
                        role: 'button',
                        title: intl.formatMessage(
                          { id: 'doc.goto-lexicon-link-title' },
                          { title: dt },
                        ),
                      },
                      dt,
                    ),
                h(
                  'button.close',
                  {
                    role: 'button',
                    'aria-label': intl.formatMessage({ id: 'fo.close' }),
                  },
                  '⨯',
                ),
              ]),
              h(
                'dd',
                {},
                exports.linkInternalDefinitions(
                  found,
                  definitions,
                  globalPageUrl('definition')(options),
                ),
              ),
            ]),
          ],
        )
      }),
  ),
)

const marker = `£¨§ø£`
exports.linkInternalDefinitions = (singleDefinition, definitions, url = '') => {
  if (!singleDefinition) {
    return null
  }
  const { lexicon: dts, dd } = singleDefinition
  const markedText = dts.reduce(
    (txt, dt) => txt.replace(dt, marker + dt + marker),
    dd,
  )
  const tokens = markedText.split(marker)
  return tokens.map(token => {
    const found = getDefinition(token, definitions, true)
    if (found) {
      return h('a', { href: url + '#' + slugify(found.dt) }, token)
    } else {
      return token
    }
  })
}
