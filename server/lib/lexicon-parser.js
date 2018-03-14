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

exports.parseLexicon = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)

  // parser state
  let incipit = true
  let skip = 0

  const parseChild = $ => (i, el) => {
    // 'A' reached, start saving defs
    if (el.name === 'h1') {
      incipit = false
      return null
    }
    if (incipit) return null

    // Previously handled el.next elements
    if (skip > 0) {
      skip--
      return null
    }

    const text = getText($, el)
    const [dt] = text.split(' [')

    let dd = null
    let aliases = []
    while (dd === null) {
      el = el.next
      skip++
      const text = getText($, el)
      const foundAliases = parseAliases(text)
      if (foundAliases) {
        aliases = aliases.concat(foundAliases)
      } else {
        dd = text
      }
    }

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
