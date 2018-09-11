'use strict'

const removeDiacritics = require('diacritics').remove
const removeStopWords = require('./remove-stopwords')
const { cleanSearchFields, cleanSearchFieldSuffix } = require('config')
const { stripTags } = require('../../client/src/universal-utils')
const { cloneDeep } = require('lodash')

exports.cleanFields = (resource, language = null) => {
  const copy = cloneDeep(resource)
  cleanObject('', copy, language)
  return copy
}

// DESTRUCTIVE PROCEDURE
const cleanObject = (root, obj, language) => {
  if (Array.isArray(obj)) {
    obj.forEach(o => cleanObject(root, o, language))
  } else {
    cleanSearchFields
      .filter(f => f.startsWith(root))
      .map(f => f.substring(root.length))
      .forEach(f => {
        const [field] = f.split('.')
        // Nested's parent
        if (obj[field]) {
          if (typeof obj[field] === 'object') {
            // Recursive transform
            cleanObject(`${root}${field}.`, obj[field], language)
          } else {
            // String transforma
            const lang = guessLanguage(obj, root + field, language)
            obj[field + cleanSearchFieldSuffix] = exports.cleanString(
              obj[field],
              lang,
            )
          }
        }
      })
  }
}

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
  removeQuotes(
    removeStopWords(removeDiacritics(stripTags(string)), language),
  ).trim()

const removeQuotes = string => string.replace(/[“”«»'’]/g, '')
