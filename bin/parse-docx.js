const { readFileSync } = require('fs')
const { resolve } = require('path')

const { parseDocx } = require('../server/lib/doc-parser')

const path =
  process.argv[2] ||
  resolve(__dirname, '../docs/samples/4/', '4A07 Paix négatives.docx')

const main = async path => {
  const doc = await parseDocx(readFileSync(path))
  return JSON.stringify(doc, null, 2)
}
main(path).then(console.log, console.error)
