'use strict'

const mammoth = require('mammoth')
const cheerio = require('cheerio')

// helpers
const getText = ($, el) =>
  $(el)
    .text()
    .trim()

exports.parseLexicon = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)

  // parser state
  let incipit = true
  let skip = true

  const parseChild = $ => (i, el) => {
    // 'A' reached, start saving defs
    if (el.name === 'h1') {
      incipit = false
      return null
    }
    if (incipit) return null

    skip = !skip
    if (skip) return null

    const text = getText($, el)
    const [dt, resourceId] = text.split(' [')

    if (!resourceId) {
      throw new Error('No definition ID: ' + text)
    }

    return {
      dt,
      dd: getText($, el.next),
      resourceId: resourceId.slice(0, -1),
    }
  }

  return {
    definitions: $('#cheerio')
      .children()
      .map(parseChild($))
      .get(),
  }
}
