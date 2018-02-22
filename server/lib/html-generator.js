const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Now all env variables are available just like if it was built for client side
const ArticlePreview = require('../../client/src/components/ArticlePreview')

exports.generateHTML = (article, topics, definitions, resources) => {
  return `<!DOCTYPE html>${renderToStaticMarkup(
    React.createElement(ArticlePreview, {
      article,
      topics,
      definitions,
      resources,
    }),
  )}`
}
