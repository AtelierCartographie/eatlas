'use strict'

const mammoth = require('mammoth')
const cheerio = require('cheerio')

// helpers

const getText = ($, el) =>
  $(el)
    .text()
    .trim()

const getList = ($, el) =>
  $(el)
    .children()
    .map((i, el) => getText($, el))
    .get()

// semantic agnostic
const conversions = {
  // nodes
  h1: 'header',
  // metas
  auteur: 'author',
  partie: 'topic',
  identifiant: 'id',
  'Mots-clés': 'keywords',
  'Résumé-FR': 'summary-fr',
  "Continuer dans l'Atlas": 'related',
  Références: 'references',
  // focus only
  'article-associé': 'related-article',
  'Image header': 'image-header',
}

const getType = name => {
  return conversions[name] ? conversions[name] : name
}

// hyperlinks found in paragraphs and footnotes
const parseLinks = ($, el) =>
  $(el)
    .children()
    .filter((i, el) => el.name === 'a' && el.attribs.href)
    // beware of cheerio and flatMap
    .map((i, el) => [{ label: getText($, el), url: el.attribs.href }])
    // weird edge case
    .filter(l => l.label)
    .get()

// "definitions" found in paragraphs
const parseLexicon = ($, el) =>
  $(el)
    .children()
    .filter(
      (i, el) => el.name === 'span' && el.attribs.style === 'color: #ff0000',
    )
    // beware of cheerio and flatMap
    .map((i, el) => [getText($, el)])
    .get()

const parseResource = text => {
  text = text.slice(1, -1)
  const [id, ...rest] = text.split('-').map(s => s.trim())
  return {
    type: 'resource',
    id,
    text: rest.join(''),
  }
}

const parseMeta = text => {
  const regexp = /^\{(.*?)\}:(.*)/
  const [, id, value] = regexp.exec(text)
  return {
    type: 'meta',
    id,
    // remove quotes
    text: value.trim().slice(1, -1),
  }
}

const parseMetaNext = ($, { next }, meta) => {
  if (!next) return meta

  switch (next.name) {
    case 'p':
      meta.text = getText($, next)
      break

    case 'ul':
      delete meta.text
      meta.list = getList($, next).map(text => ({ text }))
      break
  }
  return meta
}

const parseFootnotes = ($, el) => {
  const links = parseLinks(
    $,
    $(el)
      .children()
      .first(),
  ).filter(([label]) => label !== '↑')

  return {
    type: 'footnotes',
    list: $(el)
      .children()
      .map((i, el) => ({
        // trim up arrow ↑
        text: getText($, el).slice(0, -2),
        links,
      }))
      .get(),
  }
}

const parseChild = $ => (i, el) => {
  const text = getText($, el)
  if (i === 0) return { type: 'meta', id: 'title', text }

  switch (el.name) {
    case 'p':
      if (text.startsWith('[') && text.endsWith(']')) return parseResource(text)
      break

    // meta
    case 'h3':
      if (text.startsWith('{')) {
        let meta = parseMeta(text)
        // meta content is in next node
        if (!meta.text) {
          el.skipNext = true
          meta = parseMetaNext($, el, meta)
        }
        return meta
      }
      break

    case 'ol':
      return parseFootnotes($, el)
  }
  if (!el.prev.skipNext)
    return {
      type: getType(el.name),
      text,
      links: parseLinks($, el),
      lexicon: parseLexicon($, el),
    }
}

const extractMetas = nodes =>
  nodes.filter(n => n.type === 'meta').map(m => {
    const meta = {
      type: getType(m.id),
    }
    if (m.text) meta.text = m.text
    if (m.list) meta.list = m.list
    return meta
  })

exports.parseDocx = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)
  const nodes = $('#cheerio')
    .children()
    .map(parseChild($))
    .get()
    .filter(n => n && (typeof n.text !== 'string' || n.text))

  return {
    nodes: nodes.filter(n => n.type !== 'meta'),
    metas: extractMetas(nodes),
  }
}
