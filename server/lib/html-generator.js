const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Now all env variables are available just like if it was built for client side
const ArticlePreview = require('../../client/src/components/preview/ArticlePreview')
const TopicPreview = require('../../client/src/components/preview/TopicPreview')

const wrap = element => `<!DOCTYPE html>${renderToStaticMarkup(element)}`

exports.generateArticleHTML = (article, topics, definitions, resources) => {
  return wrap(
    React.createElement(ArticlePreview, {
      article,
      topics,
      definitions,
      resources,
    }),
  )
}

exports.generateTopicHTML = (topic, topics, articles) => {
  return wrap(
    React.createElement(TopicPreview, {
      topic,
      topics,
      articles
    }),
  )
}
