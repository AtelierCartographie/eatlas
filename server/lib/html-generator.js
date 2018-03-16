'use strict'

// Tools to grab data required by components
const {
  flattenMetas,
  getTopics,
  getDefinitions,
  getArticleResources,
  getImageHeader,
  getTopicResources,
  populateFocus,
  getResource,
  getArticles,
  populatePageUrl,
} = require('./generator-utils')
const {
  footerResourcesConfig,
  LOCALES,
  getMetaList,
} = require('../../client/src/universal-utils')

// React dependencies for HTML generation
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Inject client-side env variables allowing generation of URLs
for (let key in config.pageUrls) {
  process.env['REACT_APP_PAGE_URL_' + key] = config.pageUrls[key]
}

// Now all env variables are available just like if it was built for client side
const ArticlePage = require('../../client/src/components/preview/ArticlePage')
const FocusPage = require('../../client/src/components/preview/FocusPage')
const TopicPage = require('../../client/src/components/preview/TopicPage')
const ResourcePage = require('../../client/src/components/preview/ResourcePage')
const HomePage = require('../../client/src/components/preview/HomePage')
const SearchPage = require('../../client/src/components/preview/SearchPage')
const MissingPage = require('../../client/src/components/preview/MissingPage')

const GENERATORS = {
  index: 'generateHomeHTML',
  search: 'generateSearchHTML',
  aboutUs: 'generateAboutWhoHTML',
  contact: 'generateAboutContactHTML',
  legals: 'generateAboutLegalsHTML',
  sitemap: 'generateSiteMapHTML',
  resources: 'generateResourcesHTML',
  topic: 'generateTopicHTML',
  article: 'generateArticleHTML',
  focus: 'generateFocusHTML',
  definition: 'generateResourceHTML',
  sound: 'generateResourceHTML',
  video: 'generateResourceHTML',
  image: 'generateResourceHTML',
  map: 'generateResourceHTML',
}

const wrap = element => `<!DOCTYPE html>${renderToStaticMarkup(element)}`

const topMenuProps = async (
  { topics = null, articles = null } = {},
  { preview = false } = {},
) => {
  topics = populatePageUrl('topic', topics, { preview })(
    topics || (await getTopics()),
  )
  articles = populatePageUrl(null, topics, { preview })(
    articles || (await getArticles()),
  )
  return { topics, articles }
}

exports.generateHTML = async (key, resource, options, props = {}) => {
  let generator = GENERATORS[key]
  if (!generator) {
    throw new Error(`No HTML generator for "${key}"`)
  }
  if (typeof generator === 'string') {
    const name = generator
    generator = exports[name]
    if (!generator) {
      throw new Error(`No function "${name}" for generator key "${key}"`)
    }
  }

  props = await topMenuProps(props, options)
  const html = resource
    ? await generator(resource, options, props)
    : await generator(options, props)

  return html
}

exports.generateArticleHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  props = await topMenuProps(props, { preview })
  const article = flattenMetas(resource)
  const definitions = await getDefinitions()
  let resources = await getArticleResources(resource, !preview)

  // need to retrieve imageHeader for "related" articles in footer since they're transitives deps
  resources = await Promise.all(
    resources.map(async r => {
      if (r.type === 'article') {
        r.imageHeader = await getImageHeader(r)
      }
      return r
    }),
  )

  return wrap(
    React.createElement(ArticlePage, {
      ...props,
      article: populatePageUrl(null, props.topics, { preview })(article),
      definitions: populatePageUrl('definition', props.topics, { preview })(
        definitions,
      ),
      resources: populatePageUrl(null, props.topics, { preview })(resources),
      options: { preview },
    }),
  )
}

exports.generateFocusHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  props = await topMenuProps(props, { preview })
  let focus = flattenMetas(resource)
  // to create the "go back to article" link
  focus.relatedArticleId = focus.relatedArticle
  focus.relatedArticle = await getResource(focus.relatedArticleId)
  const definitions = await getDefinitions()
  const resources = await getArticleResources(resource, !preview)

  return wrap(
    React.createElement(FocusPage, {
      ...props,
      focus: populatePageUrl(null, props.topics, { preview })(focus),
      definitions: populatePageUrl('definition', props.topics, { preview })(
        definitions,
      ),
      resources: populatePageUrl(null, props.topics, { preview })(resources),
      options: { preview },
    }),
  )
}

exports.generateTopicHTML = async (
  topic,
  { preview = false } = {},
  props = {},
) => {
  props = await topMenuProps(props, { preview })
  const resources = await getTopicResources(topic)
  // Enhanced articles for data list in topic page
  props.articles = await Promise.all(
    (props.articles || resources.filter(r => r.type === 'article'))
      .map(flattenMetas)
      .map(async a => {
        a.imageHeader = await getImageHeader(a)
        a.focus = await populateFocus(a, resources)
        return a
      }),
  )

  return wrap(
    React.createElement(TopicPage, {
      ...props,
      topic: populatePageUrl('topic', null, { preview })(topic),
      articles: props.articles,
      resources: populatePageUrl(null, props.topics, { preview })(resources),
      options: { preview },
    }),
  )
}

exports.generateResourceHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  props = await topMenuProps(props, { preview })
  return wrap(
    React.createElement(ResourcePage, {
      ...props,
      resource: populatePageUrl(null, props.topics, { preview })(resource),
      options: { preview },
    }),
  )
}

exports.generateHomeHTML = async ({ preview = false } = {}, props = {}) => {
  props = await topMenuProps(props, { preview })
  return wrap(
    React.createElement(HomePage, {
      ...props,
      options: { preview },
    }),
  )
}

exports.generateSearchHTML = async (
  { preview = false, types = null } = {},
  props = {},
) => {
  props = await topMenuProps(props, { preview })
  const keywords = props.articles.reduce(
    (kws, article) =>
      kws.concat(getMetaList(article, 'keywords').map(({ text }) => text)),
    [],
  )
  return wrap(
    React.createElement(SearchPage, {
      ...props,
      types,
      keywords: [...new Set(keywords)].sort(),
      locales: LOCALES,
      options: { preview },
    }),
  )
}

exports.generateResourcesHTML = async (
  { preview = false, resourcesSlug } = {},
  props = {},
) => {
  const conf = footerResourcesConfig.find(({ slug }) => slug === resourcesSlug)
  if (!conf) {
    throw new Error('Invalid resourcesSlug "' + resourcesSlug + '"')
  }
  return exports.generateSearchHTML({ preview, types: conf.searchTypes }, props)
}

const generateMissingHTML = async ({ preview = false } = {}, props = {}) => {
  props = await topMenuProps(props, { preview })
  return wrap(
    React.createElement(MissingPage, {
      ...props,
      options: { preview },
    }),
  )
}

exports.generateResourcesHTML = generateMissingHTML
exports.generateAboutWhoHTML = generateMissingHTML
exports.generateAboutContactHTML = generateMissingHTML
exports.generateAboutLegalsHTML = generateMissingHTML
exports.generateSiteMapHTML = generateMissingHTML
