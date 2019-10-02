if (typeof Intl === 'undefined' || !Intl.PluralRules) {
  require('@formatjs/intl-pluralrules/polyfill')
}

if (typeof Intl === 'undefined' || !Intl.RelativeTimeFormat) {
  require('@formatjs/intl-relativetimeformat/polyfill')
}

require('@formatjs/intl-relativetimeformat/dist/locale-data/fr')
require('@formatjs/intl-relativetimeformat/dist/locale-data/en')
require('@formatjs/intl-pluralrules/dist/locale-data/fr')
require('@formatjs/intl-pluralrules/dist/locale-data/en')

const timeago = require('timeago.js')

const enTime = require('timeago.js/lib/lang/en_short')
const frTime = require('timeago.js/lib/lang/fr')

timeago.register('en', enTime)
timeago.register('fr', frTime)

module.exports = require('./messages')
