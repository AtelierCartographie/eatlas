// @flow

// components shared by ArticlePage and FocusPage

const { getDefinition } = require('../../universal-utils')
const { Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { HOST } = require('./layout')

exports.PublishedAt = ({ doc } /*: { doc: Resource } */) =>
  !doc.publishedAt
    ? h('.PublishedAt', 'Non publié')
    : h('.PublishedAt', [
        'Publié le ',
        h(
          'time',
          { dateTime: doc.publishedAt },
          moment(doc.publishedAt).format('D MMMM YYYY'),
        ),
      ])

// first parse lexicon, then footnotes
exports.Paragraph = (
  { p, lexiconId } /*: {p: Object, lexiconId: {id: number }} */,
) => {
  const parseFootnotes = str => {
    const m = str.match(/(.*)\[(\d+)\](.*)/)
    if (!m) return str
    return [
      m[1],
      h('sup', [
        h(
          'a.FootnoteLink',
          { id: `note-${m[2]}`, href: `#footnote-${m[2]}` },
          `[${m[2]}]`,
        ),
      ]),
      m[3],
    ]
  }

  let parts = []
  parts.push(
    p.lexicon.reduce((tail, l) => {
      const [head, _tail] = tail.split(l)
      parts.push(
        head,
        h(
          'a.LexiconLink',
          { href: `#lexicon-${++lexiconId.id}`, 'data-toggle': 'collapse' },
          l,
        ),
      )
      return _tail
    }, p.text),
  )
  parts = parts.map(p => {
    if (typeof p !== 'string') return p
    return h(Fragment, { key: p }, parseFootnotes(p))
  })

  return h('p.container.DocParagraph', parts)
}

exports.Keywords = ({ keywords } /*: { keywords: Object } */) => {
  if (!keywords || !keywords.length) return null

  return h('section.container.Keywords', [
    h('h2', 'Mots-clés'),
    h(
      'ul',
      keywords.map((kw, i) =>
        h('li', { key: i }, [h('a', { href: '#TODO' }, kw.text)]),
      ),
    ),
  ])
}

exports.Quote = ({ doc } /*: { doc: Resource } */) => {
  // TODO conf?
  const publication = 'Atlas de la mondialisation'
  const year = new Date(doc.publishedAt || Date.now()).getFullYear()
  const url = `${HOST}`

  const bibtex = `@book{eAtlas,
  title={${doc.title}},
  author={${doc.author}},
  url={TODO},
  year={${year}},
  publisher={${publication}}
}`
  const endnote = `%0 Book
%T ${doc.title}
%A ${doc.author}
%U TODO
%D ${year}
%I ${publication}`

  const refman = `TY  - BOOK
T1  - ${doc.title}
A1  - ${doc.author}
UR  - TODO
Y1  - ${year}
PB  - ${publication}`

  return h('section.container.Quote', [
    h('h2', 'Citation'),
    h('blockquote', [
      h('p', [
        h(
          'span',
          `"${doc.title}", ${publication}, ${year}, [en ligne], consulté le `,
        ),
        h('span.consultedAt', moment().format('D MMMM YYYY')),
        h('span', ', URL:'),
        h('br'),
        h('span.articleUrl', url),
      ]),
    ]),
    h('ul.exports', [
      h('li', [
        h(
          'a',
          {
            download: 'citation.bibtex',
            href: `data:,${encodeURIComponent(bibtex)}`,
          },
          ['BibTex'],
        ),
      ]),
      h('li', [
        h(
          'a',
          {
            download: 'citation.enw',
            href: `data:,${encodeURIComponent(endnote)}`,
          },
          ['EndNote'],
        ),
      ]),
      h('li', [
        h(
          'a',
          {
            download: 'citation.ris',
            href: `data:,${encodeURIComponent(refman)}`,
          },
          ['RefMan'],
        ),
      ]),
    ]),
  ])
}

// also called simply 'Notes' or 'Références'
exports.Footnotes = (
  { references, footnotes } /*: { references: Object[], footnotes: Object[] }*/,
) => {
  if ((!references || !references.length) && (!footnotes || !footnotes.length))
    return null

  const parseLinks = ({ text, links }) => {
    let parts = []
    parts.push(
      links.reduce((tail, link) => {
        const [head, _tail] = tail.split(link.label)
        parts.push(head, h('a.external', { href: link.url }, link.label))
        return _tail
      }, text),
    )
    parts = parts.map(p => {
      if (typeof p !== 'string') return p
      return h(Fragment, { key: p }, p)
    })
    return parts
  }

  return h('section.container.Footnotes', [
    h('h2', 'Références'),
    h('.gradient-expand', [
      h(
        'ol',
        footnotes.map((n, k) => {
          return h('li', { id: `footnote-${k + 1}`, key: k }, [
            h('a.back', { href: `#note-${k + 1}` }, '^'),
            parseLinks(n),
          ])
        }),
      ),
      h(
        'ol',
        references.map((r, k) => {
          return h('li', { key: k }, r.text)
        }),
      ),
      h('.read-more', ['▼']),
    ]),
  ])
}

exports.Lexicon = (
  { nodes, definitions } /*: { nodes: Object[], definitions: Object[] } */,
) =>
  h(
    'section.Lexicon',
    nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((l, k) =>
        h('.collapse.container', { key: k, id: `lexicon-${k + 1}` }, [
          h('dl', [h('dt', l), h('dd', getDefinition(l, definitions))]),
        ]),
      ),
  )
