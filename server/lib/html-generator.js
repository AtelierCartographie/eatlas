const { parseDocx } = require('./doc-parser')
const cheerio = require('cheerio')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ArticlePreview = require('../../client/src/components/ArticlePreview')

exports.generateHTML = (article, topics) => {
  return `<!DOCTYPE html>${renderToStaticMarkup(
    React.createElement(ArticlePreview, { article, topics }),
  )}`
}
