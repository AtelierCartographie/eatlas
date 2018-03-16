const { readFileSync } = require('fs')
const { resolve } = require('path')

const { parseArticle } = require('../server/lib/doc-parsers')

const path =
  process.argv[2] ||
  resolve(__dirname, '../docs/samples/4/', '4A07 Paix négatives.docx')

const main = async path => {
  const doc = await parseArticle(readFileSync(path))
  return JSON.stringify(doc, null, 2)
}
main(path).then(console.log, console.error)
