// Wrapper grabbing i18n JSON files to allow accessing
// translations without react-intl

const fr = require('../../client/src/i18n/fr')
const en = require('../../client/src/i18n/en')

const translations = { fr, en }

module.exports = (type, lang = 'fr') =>
  (((translations[lang] || {}).fo || {})['type-label'] || {})[type] || type
