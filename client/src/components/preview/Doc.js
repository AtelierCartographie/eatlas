// @flow

// components shared by ArticlePage and FocusPage

const { Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

exports.PublishedAt = ({ doc }) =>
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
exports.Paragraph = ({ p, lexiconId }) => {
  const parseFootnotes = str => {
    const m = str.match(/(.*)\[(\d+)\](.*)/)
    if (!m) return str
    return [
      m[1],
      h('sup', [
        h('a', { id: `note-${m[2]}`, href: `#footnote-${m[2]}` }, `[${m[2]}]`),
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
          'a.keyword',
          { href: `#keyword-${++lexiconId.id}`, 'data-toggle': 'collapse' },
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

  return h('p.container', parts)
}

const getDefinition = (definitions, dt) => {
  const search = dt.toLowerCase()
  const found = definitions.find(({ dt }) => dt.toLowerCase() === search)
  if (!found || !found.dd) {
    return 'Definition not found'
  }
  return found.dd
}

exports.Lexicon = ({ nodes, definitions }) =>
  h(
    'section.Lexicon',
    nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((l, k) =>
        h('.collapse.container', { key: k, id: `keyword-${k + 1}` }, [
          h('dl', [h('dt', l), h('dd', getDefinition(definitions, l))]),
        ]),
      ),
  )
