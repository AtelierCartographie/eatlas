'use strict'

const mammoth = require('mammoth')
const cheerio = require('cheerio')

const getText = ($, el) =>
  $(el)
    .text()
    .trim()

const getList = ($, el) =>
  $(el)
    .children()
    .map((i, el) => getText($, el))
    .get()

const parseLinks = ($, el) =>
  $(el)
    .children()
    .filter((i, el) => el.name === 'a' && el.attribs.href)
    // beware of cheerio and flatMap
    .map((i, el) => [[getText($, el), el.attribs.href]])
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
  switch (next.name) {
    case 'p':
      meta.text = getText($, next)
      break

    case 'ul':
      delete meta.text
      meta.list = getList($, next)
      break
  }
  return meta
}

const parseFootnotes = ($, el) => ({
  type: 'footnotes',
  list: $(el)
    .children()
    .map((i, el) => ({
      // trim up arrow ↑
      text: getText($, el).slice(0, -2),
      links: parseLinks(
        $,
        $(el)
          .children()
          .first(),
      ).filter(([label]) => label !== '↑'),
    }))
    .get(),
})

const parseChild = $ => (i, el) => {
  const text = getText($, el)
  if (i === 0) return { type: 'title', text }

  switch (el.name) {
    case 'p':
      if (text.startsWith('[') && text.endsWith(']')) return parseResource(text)
      break

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
      type: el.name,
      text,
      links: parseLinks($, el),
    }
}

exports.parseDocx = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)
  const nodes = $('#cheerio')
    .children()
    .map(parseChild($))
    .get()
    .filter(n => n && (typeof n.text !== 'string' || n.text))
  return { nodes }
}
