const { readFileSync } = require('fs')

const { parseArticle } = require('../server/lib/doc-parsers')

const main = async path => {
  const doc = await parseArticle(readFileSync(path))
  return JSON.stringify(doc, null, 2)
}
main(process.argv[2]).then(console.log, console.error)
