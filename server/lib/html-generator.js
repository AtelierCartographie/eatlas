const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ArticlePreview = require('../../client/src/components/ArticlePreview')

exports.generateHTML = (article, topics, definitions) => {
  return `<!DOCTYPE html>${renderToStaticMarkup(
    React.createElement(ArticlePreview, { article, topics, definitions }),
  )}`
}
