const { readFileSync } = require('fs')
const { resolve } = require('path')

const { parseDocx } = require('../server/lib/doc-parser')

const path = resolve(__dirname, '../docs/samples', '4A07 Paix négatives.docx')

parseDocx(readFileSync(path))
	.then(result => JSON.stringify(result, null, 2))
	.then(console.log, console.error)
