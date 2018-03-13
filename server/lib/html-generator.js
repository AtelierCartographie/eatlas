const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Now all env variables are available just like if it was built for client side
const ArticlePage = require('../../client/src/components/preview/ArticlePage')
const TopicPage = require('../../client/src/components/preview/TopicPage')

const wrap = element => `<!DOCTYPE html>${renderToStaticMarkup(element)}`

exports.generateArticleHTML = (
  article,
  topics,
  definitions,
  resources,
  options = { preview: false },
) => {
  return wrap(
    React.createElement(ArticlePage, {
      article,
      topics,
      definitions,
      resources,
      options,
    }),
  )
}

// TODO @delapouite ;)
exports.generateFocusHTML = exports.generateArticleHTML

exports.generateTopicHTML = (
  topic,
  topics,
  articles,
  resources,
  options = { preview: false },
) => {
  return wrap(
    React.createElement(TopicPage, {
      topic,
      topics,
      articles,
      resources,
      options,
    }),
  )
}
