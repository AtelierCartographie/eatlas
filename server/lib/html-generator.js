const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Now all env variables are available just like if it was built for client side
const Article = require('../../client/src/components/preview/Article')
const Topic = require('../../client/src/components/preview/Topic')

const wrap = element => `<!DOCTYPE html>${renderToStaticMarkup(element)}`

exports.generateArticleHTML = (article, topics, definitions, resources, options) => {
  return wrap(
    React.createElement(Article, {
      article,
      topics,
      definitions,
      resources,
      options,
    }),
  )
}

exports.generateTopicHTML = (topic, topics, articles, options) => {
  return wrap(
    React.createElement(Topic, {
      topic,
      topics,
      articles,
      options,
    }),
  )
}
