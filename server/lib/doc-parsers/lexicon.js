'use strict'

const mammoth = require('mammoth')
const cheerio = require('cheerio')

// Helpers
const { isLexiconElement, getText } = require('./helpers')

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

const parseInternalDefinitions = ($, el) =>
  $(el)
    .children()
    .filter((i, el) => isLexiconElement(el))
    // beware of cheerio and flatMap
    .map((i, el) => [getText($, el)])
    // in some weird documents, the "red range" include blanks and punctuation marks
    // see 5A05 "Alimentation" pre vs pro editing
    .filter((i, text) => text.length > 1)
    .get()

/**
 * Expected format:
 *
 * (<h1>Letter
 *   (<h2>Title
 *    (<h3>Alias)*
 *    (<p>Definition)+
 *   )*
 * )*
 */
module.exports = async buffer => {
  const { value } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)

  const newDefinition = dt => ({ dt, dd: '', aliases: [], lexicon: [] })

  // Current parsed definition
  let definitions = []
  let currentDefinition = null

  const parseChild = $ => (i, el) => {
    if (el.name === 'h2') {
      // Title = new definition
      const text = getText($, el)
      const [dt] = text.split(' [')
      currentDefinition = newDefinition(dt)
    } else if (currentDefinition && el.name === 'h3') {
      // Aliases in current definition
      currentDefinition.aliases = currentDefinition.aliases.concat(
        parseAliases(getText($, el)),
      )
    } else if (currentDefinition && el.name === 'p') {
      // The actual definition
      currentDefinition.lexicon = parseInternalDefinitions($, el)
      currentDefinition.dd = getText($, el)
      // Definition ends here
      definitions.push(currentDefinition)
      currentDefinition = null
    }
  }

  $('#cheerio')
    .children()
    .each(parseChild($))

  return { definitions }
}
