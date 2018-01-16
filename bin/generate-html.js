// temp script
// its goal is too start from the sample docx and turn in into mockup.html

const { promisify } = require('util')
let { readFileSync, writeFile } = require('fs')
writeFile = promisify(writeFile)
const { resolve } = require('path')

const { generateHTML } = require('../server/lib/html-generator')

const path = resolve(__dirname, '../docs/samples/4/4A07 Paix négatives.docx')
const mockupPath = resolve(__dirname, '../docs/samples/4/mockup.html')

const main = async (path, mockupPath) => {
  const html = await generateHTML(
    readFileSync(path),
    readFileSync(mockupPath, 'utf8'),
  )
  // gitignored
  return writeFile(resolve(__dirname, '../docs/samples/4/output.html'), html)
}

main(path, mockupPath).then(console.log, console.error)
