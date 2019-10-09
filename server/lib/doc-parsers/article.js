'use strict'

// article and focus gdocs

const mammoth = require('mammoth')
const cheerio = require('cheerio')
const {
  META_CONVERSION,
  META_LIST_EXPECTED,
  LOCALES,
} = require('../../../client/src/universal-utils')

// Helpers
const { isLexiconElement, getText } = require('./helpers')

const getList = ($, el) =>
  $(el)
    .children()
    .map((i, el) => ({
      text: exports.getText($, el),
      markup: exports.parseMarkup($, el),
    }))
    .get()

const getType = name => {
  return META_CONVERSION[name] ? META_CONVERSION[name] : name
}

// hyperlinks found in paragraphs and footnotes
const parseLinks = ($, el) =>
  $(el)
    .children()
    .filter((i, el) => el.name === 'a' && el.attribs.href)
    // beware of cheerio and flatMap
    .map((i, el) => [{ label: getText($, el), url: el.attribs.href }])
    .get()
    .filter(({ label }) => label && label !== '↑')

// "definitions" found in paragraphs
const parseLexicon = ($, el) =>
  $(el)
    .children()
    .filter((i, el) => isLexiconElement(el))
    // beware of cheerio and flatMap
    .map((i, el) => [getText($, el)])
    // in some weird documents, the "red range" include blanks and punctuation marks
    // see 5A05 "Alimentation" pre vs pro editing
    .filter((i, text) => text.length > 1)
    .get()

const parseResource = text => {
  text = text.slice(1, -1)
  const [id, ...rest] = text.split('-')
  // Note: id can contain language as suffix, separated by a dash "-"
  // so we can have actually [id, lang, rest] or [id, rest]
  let fullText = ''
  let fullId = ''
  const localeId = (rest[0] || '').trimRight().toLowerCase()
  if (LOCALES[localeId]) {
    fullId = `${id.trim()}-${rest[0].trimRight().toUpperCase()}`
    fullText = rest.slice(1).join('-')
  } else {
    fullId = id.trim()
    fullText = rest.join('-')
  }
  return {
    type: 'resource',
    id: fullId,
    text: fullText,
  }
}

const parseMeta = text => {
  const regexp = /^\{(.*?)\}:(.*)/
  const [, id, value] = regexp.exec(text)
  return {
    type: 'meta',
    id,
    // remove quotes, ex: {partie}: “2”
    text: value.trim().slice(1, -1),
  }
}

const parseMetaNext = ($, { next }, meta) => {
  if (!next) return meta

  switch (next.name) {
    case 'p':
      meta.text = getText($, next)
      break

    case 'ul': {
      delete meta.text
      // ideally we should remove markup for lists other than 'Références'
      // but this exception make the Joi validation way too hard
      meta.list = getList($, next)
      break
    }
  }
  return meta
}

// <li id="footnote-0"><p><a>…</a></p></li>
// proper 'Word footnotes' are being phased out in favor
// of the Références meta
const parseFootnotes = ($, el) => {
  return {
    type: 'footnotes',
    list: $(el)
      .children()
      .map((i, el) => ({
        // trim up arrow ↑
        text: getText($, el).slice(0, -2),
        markup: parseMarkup($, el),
        links: parseLinks(
          $,
          $(el)
            .children()
            .first(),
        ),
      }))
      .get(),
  }
}

// in paragraph, footnotes and Références meta
// info needed to build final preview output (see Doc.js)
const parseMarkup = ($, el) => {
  const markup = $(el)
    // include text nodes
    .contents()
    .map((i, el) => {
      const text = getText($, el)
      if (!text) return false
      if (el.type === 'text') return { type: 'text', text }

      switch (el.name) {
        // styling
        case 'em':
        case 'strong':
          return { type: el.name, text }

        case 'sup': {
          if (/\[\d+\]/.test(text))
            return { type: 'footnote', text: text.slice(1, -1) }
          // example 1er (premier)
          return { type: 'sup', text }
        }

        case 'span':
          if (!isLexiconElement(el)) {
            return false
          }
          return { type: 'lexicon', text }

        case 'a':
          if (!el.attribs.href) return false
          return { type: 'link', text, url: el.attribs.href }
      }
      return false
    })
    .get()
    .filter(x => x)

  return markup
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
      text, // clean data used for elastic-searching
      markup: parseMarkup($, el), // used to build final output
      links: parseLinks($, el),
      lexicon: parseLexicon($, el),
    }
}

const extractMetas = nodes =>
  nodes
    .filter(n => n.type === 'meta')
    .map(m => {
      const meta = {
        type: getType(m.id),
      }
      if (m.text) meta.text = m.text
      if (m.list) meta.list = m.list
      if (META_LIST_EXPECTED.includes(meta.type) && !meta.list) {
        throw new Error(
          `La méta "${m.id}" attend une liste, mais un simple texte a été fourni`,
        )
      }
      return meta
    })

module.exports = async buffer => {
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
