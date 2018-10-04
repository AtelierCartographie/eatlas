const flat = require('flat')

const fr = require('./fr')
const en = require('./en')

module.exports = {
  fr: flat(fr),
  en: flat(en),
}
