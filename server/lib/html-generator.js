'use strict'

// React dependencies for HTML generation
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

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
  populateImageStats,
  populateImageRelatedResources,
} = require('./generator-utils')
const {
  CLIENT_TYPES,
  LOCALES,
  getMetaList,
} = require('../../client/src/universal-utils')

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
const PREVIEW_DIR = '../../client/src/components/preview'
const ArticlePage = require(`${PREVIEW_DIR}/ArticlePage`)
const FocusPage = require(`${PREVIEW_DIR}/FocusPage`)
const TopicPage = require(`${PREVIEW_DIR}/TopicPage`)
const ResourcePage = require(`${PREVIEW_DIR}/ResourcePage`)
const HomePage = require(`${PREVIEW_DIR}/HomePage`)
const SearchPage = require(`${PREVIEW_DIR}/SearchPage`)
const AboutPage = require(`${PREVIEW_DIR}/AboutPage`)
const LegalsPage = require(`${PREVIEW_DIR}/LegalsPage`)
const MissingPage = require(`${PREVIEW_DIR}/MissingPage`)

const GENERATORS = {
  index: 'generateHomeHTML',
  search: 'generateSearchHTML',
  project: 'generateAboutHTML',
  team: 'generateAboutHTML',
  book: 'generateAboutHTML',
  contact: 'generateContactHTML',
  legals: 'generateLegalsHTML',
  sitemap: 'generateSiteMapHTML',
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

const menuProps = async (
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

  props = await menuProps(props, options)
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
  props = await menuProps(props, { preview })
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

  // Enhanced articles for Prev / Next inline
  props.articles = await Promise.all(
    (props.articles || resources.filter(r => r.type === 'article'))
      .map(flattenMetas)
      .map(async a => {
        a.imageHeader = await getImageHeader(a)
        return a
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
  props = await menuProps(props, { preview })
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
  props = await menuProps(props, { preview })
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
  props = await menuProps(props, { preview })
  if (resource.type === 'map' || resource.type === 'image') {
    await populateImageStats(resource, { preview })
    await populateImageRelatedResources(resource)
  }
  return wrap(
    React.createElement(ResourcePage, {
      ...props,
      resource: populatePageUrl(null, props.topics, { preview })(resource),
      options: { preview },
    }),
  )
}

exports.generateHomeHTML = async ({ preview = false } = {}, props = {}) => {
  props = await menuProps(props, { preview })
  return wrap(
    React.createElement(HomePage, {
      ...props,
      options: { preview },
    }),
  )
}

exports.generateSearchHTML = async ({ preview = false } = {}, props = {}) => {
  props = await menuProps(props, { preview })
  const keywordsWithOccurrences = props.articles
    // Article[] => string[]
    .reduce((kws, article) =>
      kws.concat(getMetaList(article, 'keywords').map(({ text }) => text)),
    [])
    // string[] => { [string]: number }
    .reduce((hash, kw) =>
      Object.assign(hash, { [kw]: (hash[kw] || 0) + 1 }),
    {})
  const sortedKeywords = Object.keys(keywordsWithOccurrences)
    // First sort alphabetically
    .sort()
    // Then sort by occurrence DESC
    .sort((kw1, kw2) => keywordsWithOccurrences[kw2] - keywordsWithOccurrences[kw1])
  return wrap(
    React.createElement(SearchPage, {
      ...props,
      types: CLIENT_TYPES,
      keywords: sortedKeywords,
      locales: LOCALES,
      options: { preview },
    }),
  )
}

const generateMissingHTML = async ({ preview = false } = {}, props = {}) => {
  props = await menuProps(props, { preview })
  return wrap(
    React.createElement(MissingPage, {
      ...props,
      options: { preview },
    }),
  )
}

exports.generateAboutHTML = async ({ preview = false } = {}, props = {}) => {
  props = await menuProps(props, { preview })
  return wrap(
    React.createElement(AboutPage, {
      ...props,
      options: { preview },
    }),
  )
}

// TODO link google form instead #133
exports.generateContactHTML = generateMissingHTML

exports.generateLegalsHTML = async ({ preview = false } = {}, props = {}) => {
  props = await menuProps(props, { preview })
  return wrap(
    React.createElement(LegalsPage, {
      ...props,
      options: { preview },
    }),
  )
}

exports.generateSiteMapHTML = generateMissingHTML
