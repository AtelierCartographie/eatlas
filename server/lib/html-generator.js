'use strict'

// React dependencies for HTML generation
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const h = require('react-hyperscript')
const { IntlProvider, injectIntl } = require('react-intl')
const messages = require('../../client/src/i18n')

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
  getAllUrls,
  getOtherLangUrl,
} = require('./generator-utils')
const { LOCALES, getMetaList } = require('../../client/src/universal-utils')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })
const apiUrl = config.apiUrl
const publicUrl = config.publicUrl

// Inject client-side env variables allowing generation of URLs
for (let lang in config.pageUrls) {
  for (let key in config.pageUrls[lang]) {
    process.env[`REACT_APP_PAGE_URL_${lang}_${key}`] =
      config.pageUrls[lang][key]
  }
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
const NotFoundPage = require(`${PREVIEW_DIR}/NotFoundPage`)
const SitemapPage = require(`${PREVIEW_DIR}/SitemapPage`)
const LexiconPage = require(`${PREVIEW_DIR}/LexiconPage`)

const GENERATORS = {
  index: 'generateHomeHTML',
  search: 'generateSearchHTML',
  about: 'generateAboutHTML',
  legals: 'generateLegalsHTML',
  sitemap: 'generateSitemapHTML',
  topic: 'generateTopicHTML',
  article: 'generateArticleHTML',
  focus: 'generateFocusHTML',
  definition: 'generateLexiconHTML',
  sound: 'generateResourceHTML',
  video: 'generateResourceHTML',
  image: 'generateResourceHTML',
  map: 'generateResourceHTML',
  notFound: 'generate404HTML',
}

const LOCALE_FROM_LANG = {
  fr: 'fr-FR',
  en: 'en-GB',
}

const wrap = (element, lang, otherUrl) => {
  const locale = LOCALE_FROM_LANG[lang] || lang
  // Build "urls" object for translated versions of the page
  const otherLang = lang === 'fr' ? 'en' : 'fr'
  const urls = { [otherLang]: otherUrl }
  const wrapped = h(
    IntlProvider,
    {
      key: locale,
      locale,
      messages: messages[lang],
      textComponent: React.Fragment,
    },
    h(
      injectIntl(({ intl }) => {
        intl.lang = lang
        intl.urls = urls
        return element
      }),
    ),
  )
  const html = renderToStaticMarkup(wrapped)
  return `<!DOCTYPE html>${html}`
}

const buildOptions = opts => ({
  analytics: config.analytics,
  apiUrl,
  publicUrl,
  hideLangSelector: config.hideLangSelector,
  ...opts,
})

const menuProps = async (
  { topics = null, articles = null } = {},
  { preview = false, lang } = {},
) => {
  topics = populatePageUrl('topic', topics, { preview, lang })(
    topics || (await getTopics()),
  )
  articles = populatePageUrl(null, topics, { preview, lang })(
    articles || (await getArticles(lang)),
  )
  return { topics, articles }
}

exports.generateHTML = async (
  key,
  resource,
  options,
  props = {},
  fallbackGenerator = null,
) => {
  let generator =
    GENERATORS[key] ||
    (fallbackGenerator ? GENERATORS[fallbackGenerator] : null)
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
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  const article = flattenMetas(resource)
  const definitions = await getDefinitions(lang)
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

  populatePageUrl(null, props.topics, { preview, lang })(article)

  return wrap(
    React.createElement(ArticlePage, {
      ...props,
      article,
      definitions: populatePageUrl('definition', props.topics, {
        preview,
        lang,
      })(definitions),
      resources: populatePageUrl(null, props.topics, { preview, lang })(
        resources,
      ),
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({ resource: article, topics: props.topics, preview }),
  )
}

exports.generateFocusHTML = async (
  resource,
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  let focus = flattenMetas(resource)
  // to create the "go back to article" link
  focus.relatedArticleId = focus.relatedArticle
  focus.relatedArticle = populatePageUrl(null, props.topics, { preview, lang })(
    await getResource(focus.relatedArticleId),
  )
  const definitions = await getDefinitions(lang)
  const resources = await getArticleResources(resource, !preview)

  populatePageUrl(null, props.topics, { preview, lang })(focus)

  return wrap(
    React.createElement(FocusPage, {
      ...props,
      focus,
      definitions: populatePageUrl('definition', props.topics, {
        preview,
        lang,
      })(definitions),
      resources: populatePageUrl(null, props.topics, { preview, lang })(
        resources,
      ),
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({ resource: focus, topics: props.topics, preview }),
  )
}

exports.generateTopicHTML = async (
  topic,
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  const resources = populatePageUrl(null, props.topics, { preview, lang })(
    await getTopicResources(topic),
  ).filter(r => r.language === lang)
  // Enhanced articles for data list in topic page
  props.articles = await Promise.all(
    (props.articles || resources.filter(r => r.type === 'article'))
      .filter(r => r.language === lang)
      .map(flattenMetas)
      .map(async a => {
        a.imageHeader = await getImageHeader(a)
        a.focus = await populateFocus(a, resources)
        return a
      }),
  )

  populatePageUrl('topic', null, { preview, lang })(topic)

  return wrap(
    React.createElement(TopicPage, {
      ...props,
      topic,
      articles: props.articles,
      resources,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({ topic, topics: props.topics, preview, lang }),
  )
}

exports.generateResourceHTML = async (
  resource,
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  if (resource.type === 'map' || resource.type === 'image') {
    await populateImageStats(resource, { preview })
    await populateImageRelatedResources(resource)
    populatePageUrl(null, props.topics, { preview, lang })(
      resource.relatedResources,
    )
    await Promise.all(
      resource.relatedResources.map(async r => {
        if (r.type === 'article') {
          r.imageHeader = await getImageHeader(r)
        }
      }),
    )
  }

  populatePageUrl(null, props.topics, { preview, lang })(resource)

  return wrap(
    React.createElement(ResourcePage, {
      ...props,
      resource,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({ resource, topics: props.topics, preview }),
  )
}

exports.generateLexiconHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  // TODO use LEXICON_ID constant (requires 'constants.js' being universal)
  const lexicon = await getResource(`LEXIC-${lang.toUpperCase()}`)
  return wrap(
    React.createElement(LexiconPage, {
      ...props,
      definitions: lexicon ? lexicon.definitions : { definitions: [] },
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'definition',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generateHomeHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  return wrap(
    React.createElement(HomePage, {
      ...props,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'index',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generateSearchHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  const keywordsWithOccurrences = props.articles
    // Article[] => string[]
    .reduce(
      (kws, article) =>
        kws.concat(getMetaList(article, 'keywords').map(({ text }) => text)),
      [],
    )
    // string[] => { [string]: number }
    .reduce(
      (hash, kw) => Object.assign(hash, { [kw]: (hash[kw] || 0) + 1 }),
      {},
    )
  const sortedKeywords = Object.keys(keywordsWithOccurrences)
    // First sort alphabetically
    .sort()
    // Then sort by occurrence DESC
    .sort(
      (kw1, kw2) => keywordsWithOccurrences[kw2] - keywordsWithOccurrences[kw1],
    )
  return wrap(
    React.createElement(SearchPage, {
      ...props,
      types: {
        article: 'doc.type-plural.article',
        focus: 'doc.type-plural.focus',
        image: 'doc.type-plural.image',
        map: 'doc.type-plural.map',
        sound: 'doc.type-plural.sound',
        video: 'doc.type-plural.video',
        'single-definition': 'doc.type-plural.definition',
        reference: 'doc.type-plural.reference',
      },
      keywords: sortedKeywords,
      locales: LOCALES,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'search',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generateAboutHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  return wrap(
    React.createElement(AboutPage, {
      ...props,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'about',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generateLegalsHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  return wrap(
    React.createElement(LegalsPage, {
      ...props,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'legals',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generateSitemapHTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  const urls = await getAllUrls({ preview, apiUrl, publicUrl })
  return wrap(
    React.createElement(SitemapPage, {
      urls,
      ...props,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'sitemap',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}

exports.generate404HTML = async (
  { preview = false, lang = 'fr' } = {},
  props = {},
) => {
  props = await menuProps(props, { preview, lang })
  return wrap(
    React.createElement(NotFoundPage, {
      ...props,
      options: buildOptions({ preview, lang }),
    }),
    lang,
    await getOtherLangUrl({
      page: 'notFound',
      topics: props.topics,
      preview,
      lang,
    }),
  )
}
