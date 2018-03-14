// @flow

// components shared by ArticlePage and FocusPage

const { Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { HOST } = require('./layout')

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

exports.Keywords = ({ keywords }) => {
  if (!keywords || !keywords.length) return null

  return h('section.container.Keywords', [
    h('h2', 'Mots-clés'),
    h(
      'ul',
      keywords.map((kw, i) =>
        h('li', { key: i }, [h('a', { href: 'TODO' }, kw.text)]),
      ),
    ),
  ])
}

exports.Quote = ({ doc }) => {
  // TODO conf?
  const publication = 'Atlas de la mondialisation'
  const year = 2016
  const url = `${HOST}`

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
  ])
}

exports.Footnotes = ({ footnotes }) => {
  if (!footnotes || !footnotes.length) return null

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
    h('h2', 'Notes'),
    h(
      'ol',
      footnotes.map((n, k) => {
        return h('li', { id: `footnote-${k + 1}`, key: k }, [
          h('span.number', k + 1),
          h('a.back', { href: `#note-${k + 1}` }, '^'),
          parseLinks(n),
        ])
      }),
    ),
  ])
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
