'use strict'

const { writeFile, ensureDir, unlink, exists } = require('fs-extra')
const path = require('path')

const logger = require('./logger')
const { topics: Topics, resources: Resources } = require('./model')
const { pagePath } = require('./resource-path')
const { footerResourcesConfig } = require('../../client/src/universal-utils')
const { populatePageUrl } = require('./generator-utils')
const {
  generateAboutContactHTML,
  generateAboutLegalsHTML,
  generateAboutWhoHTML,
  generateArticleHTML,
  generateFocusHTML,
  generateHomeHTML,
  generateResourceHTML,
  generateResourcesHTML,
  generateSearchHTML,
  generateSiteMapHTML,
  generateTopicHTML,
} = require('./html-generator')

const writePage = async (key, resource, topics, articles, params) => {
  const file = pagePath(key, resource, topics, params)

  const generator = await {
    index: generateHomeHTML,
    search: generateSearchHTML,
    aboutUs: generateAboutWhoHTML,
    contact: generateAboutContactHTML,
    legals: generateAboutLegalsHTML,
    sitemap: generateSiteMapHTML,
    resources: generateResourcesHTML,
    topic: generateTopicHTML,
    article: generateArticleHTML,
    focus: generateFocusHTML,
    definition: generateResourceHTML,
    sound: generateResourceHTML,
    video: generateResourceHTML,
    image: generateResourceHTML,
    map: generateResourceHTML,
  }[key]

  if (!generator) {
    throw new Error('No HTML generator for "' + key + '"')
  }

  const props = { articles, topics }
  const options = { preview: false }
  const html = resource
    ? await generator(resource, options, props)
    : await generator(options, props)

  await ensureDir(path.dirname(file))
  try {
    await writeFile(file, html)
    logger.info('WRITE OK', file)
    return { error: null, write: file }
  } catch (err) {
    logger.error('WRITE FAILED (skipped)', err)
    return { error: err, write: file }
  }
}

const removePage = async (key, resource, topics, params) => {
  const file = pagePath(key, resource, topics, params)
  try {
    if (await exists(file)) {
      await unlink(file)
      logger.info('REMOVE OK', file)
      return { error: null, unlink: file }
    } else {
      return { error: null, noop: file }
    }
  } catch (err) {
    logger.error('REMOVE FAILED', file)
    return { error: err, unlink: file }
  }
}

exports.rebuildAllHTML = async () => {
  const topics = populatePageUrl('topic', null)(await Topics.list())
  topics.sort((t1, t2) => Number(t1.id) - Number(t2.id))
  const resources = populatePageUrl(null, topics)(await Resources.list())
  const publishedResources = resources.filter(
    ({ status }) => status === 'published',
  )
  const unpublishedResources = resources.filter(
    ({ status }) => status !== 'published',
  )
  const articles = publishedResources.filter(({ type }) => type === 'article')

  const resultss = await Promise.all([
    // Unpublished pages
    Promise.all(
      unpublishedResources.map(resource =>
        removePage(resource.type, resource, topics),
      ),
    ),
    // Global pages
    writePage('index', null, topics, articles),
    writePage('search', null, topics, articles),
    writePage('aboutUs', null, topics, articles),
    writePage('contact', null, topics, articles),
    writePage('legals', null, topics, articles),
    writePage('sitemap', null, topics, articles),
    // Resources pages
    Promise.all(
      footerResourcesConfig.map(({ slug, types }) =>
        writePage('resources', null, topics, articles, {
          searchTypes: types,
          resourcesSlug: slug,
        }),
      ),
    ),
    // Topic pages
    Promise.all(
      topics.map(topic => writePage('topic', topic, topics, articles)),
    ),
    // Resource pages
    Promise.all(
      publishedResources.map(resource =>
        writePage(resource.type, resource, topics, articles),
      ),
    ),
  ])

  // smoosh!
  const details = resultss.reduce(
    (res, item) => res.concat(Array.isArray(item) ? item : [item]),
    [],
  )

  // report
  return {
    details,
    errored: details.some(({ error }) => error !== null),
  }
}
