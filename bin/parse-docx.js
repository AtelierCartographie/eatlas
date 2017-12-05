const { resolve } = require('path')
const mammoth = require('mammoth')
const cheerio = require('cheerio')

const path = resolve(__dirname, '../docs/samples', '4A07 Paix négatives.docx')

const getText = ($, el) =>
  $(el)
    .text()
    .trim()

const parseFootnotes = ($, el) => ({
  type: 'footnotes',
  footnotes: $(el)
    .children()
    .map((i, el) => getText($, el))
    .get(),
})

const parseChild = $ => (i, el) => {
  if (i === 0) return { type: 'title', text: getText($, el) }

  switch (el.name) {
    case 'ol':
      return parseFootnotes($, el)

    default:
      return {
        type: el.name,
        text: getText($, el),
      }
  }
}

const main = async () => {
  const { value } = await mammoth.convertToHtml({ path })
  const $ = cheerio.load(`<div id="cheerio">${value}</div>`)
  return $('#cheerio')
    .children()
    .map(parseChild($))
    .get()
    .filter(n => typeof n.text !== 'string' || n.text)
}

main().then(console.log, console.error)
