'use strict'

const mammoth = require('mammoth')
const cheerio = require('cheerio')

// helpers
const getText = ($, el) =>
  $(el)
    .text()
    .trim()

const parseAliases = text => {
  const match = text.match(/^\s*\{alias\}\s*:?\s*(.+)\s*$/)
  if (match) {
    const [, raw] = match
    if (raw[0] === '[') {
      // Alias as an array of string: beware typing into a doc could lead to special quote characters, let's try to handle them
      try {
        const values = JSON.parse(raw.replace(/[“”«»]/g, '"'))
        return values.map(string => string.trim())
      } catch (err) {
        throw new Error(
          `Invalid alias definition, could not parse "${raw}": ${err.message}`,
        )
      }
    } else {
      return [raw.trim()]
    }
  }
  return null
}

module.exports = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)

  const parseChild = $ => (i, el) => {
    if (el.name !== 'h2') return null

    const text = getText($, el)
    const [dt] = text.split(' [')

    // phantom H2
    if (!dt) return null

    let aliases = []
    let dd = ''

    // aliases?
    if (el.next.name === 'h3') {
      aliases = parseAliases(getText($, el.next))
      if (el.next.next.name === 'p') {
        dd = getText($, el.next.next)
      }
    } else if (el.next.name === 'p') {
      dd = getText($, el.next)
    }

    // definition not provided yet
    if (!dd) return null

    return {
      dt,
      dd,
      aliases,
    }
  }

  return {
    definitions: $('#cheerio')
      .children()
      .map(parseChild($))
      .get(),
  }
}
