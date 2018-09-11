'use strict'

const removeDiacritics = require('diacritics').remove
const removeStopWords = require('./remove-stopwords')
const { cleanSearchFields, cleanSearchFieldSuffix } = require('config')

// DESTRUCTIVE: changes `…_clean` fields
exports.cleanFields = (resource, language = null) =>
  cleanSearchFields.reduce((res, field) => {
    if (res[field]) {
      const lang = guessLanguage(res, field, language)
      res[field + cleanSearchFieldSuffix] = exports.cleanString(
        res[field],
        lang,
      )
    }
    return res
  }, resource)

const guessLanguage = (resource, field, language) => {
  const matchLocalizedField = field.match(/_(fr|en)/)
  if (matchLocalizedField) {
    return matchLocalizedField[1]
  }
  if (resource.language) {
    return resource.language
  }
  return language || 'fr'
}

exports.cleanString = (string, language) =>
  removeQuotes(removeStopWords(removeDiacritics(string), language))

const removeQuotes = string => string.replace(/[“”«»'’]/g, '')
