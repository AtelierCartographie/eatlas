const flat = require('flat')
const common = require('./common.json')

const fr = require('./fr')
const en = require('./en')

module.exports = {
  fr: flat(Object.assign({ common }, fr)),
  en: flat(Object.assign({ common }, en)),
}
