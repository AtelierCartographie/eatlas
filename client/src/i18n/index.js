const { addLocaleData } = require('react-intl')
const timeago = require('timeago.js')

const enData = require('react-intl/locale-data/en')
const frData = require('react-intl/locale-data/fr')

const enTime = require('timeago.js/locales/en')
const frTime = require('timeago.js/locales/fr')

addLocaleData(enData)
addLocaleData(frData)

timeago.register('en', enTime)
timeago.register('fr', frTime)

module.exports = require('./messages')
