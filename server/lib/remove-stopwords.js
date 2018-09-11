'use strict'

const config = require('config')
const Path = require('path')
const { LOCALES } = require('../../client/src/universal-utils')

const configDir = Path.dirname(config.util.getConfigSources()[0].name)

const res = Object.keys(LOCALES).reduce((dict, lang) => {
  const stopwords = require(Path.join(configDir, `stopwords-${lang}.json`))
  const re = new RegExp(
    stopwords
      .filter(word => !word.match(/^\/\//))
      .map(word => `(?:\\b${word}\\b)`)
      .join('|'),
    'gi',
  )
  return Object.assign(dict, { [lang]: re })
}, {})

module.exports = (string, language) => {
  if (!res[language]) {
    // Nothing to do with unknown language
    return string
  }
  return String(string || '').replace(res[language], '')
}
