const { readFileSync } = require('fs')
const { resolve } = require('path')

const { parseLexicon } = require('../server/lib/doc-parsers')

const path =
  process.argv[2] ||
  resolve(__dirname, '../docs/samples/', 'lexique.docx')

const main = async path => {
  const doc = await parseLexicon(readFileSync(path))
  return JSON.stringify(doc, null, 2)
}
main(path).then(console.log, console.error)

