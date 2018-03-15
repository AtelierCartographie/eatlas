'use strict'

const { writeFile, ensureDir, unlink, exists } = require('fs-extra')
const path = require('path')

const logger = require('./logger')
const { topics: Topics, resources: Resources } = require('./model')
const { pagePath } = require('./resource-path')
const { footerResourcesConfig } = require('../../client/src/universal-utils')

const writePage = async (key, resource, topics, resources, params) => {
  const file = pagePath(key, resource, topics, params)
  // TODO generate real HTML
  const html = '<strong>TODO</strong>'
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

exports.rebuildFullSite = async () => {
  const topics = await Topics.list()
  const resources = await Resources.list()
  const publishedResources = resources.filter(
    ({ status }) => status === 'published',
  )
  const unpublishedResources = resources.filter(
    ({ status }) => status !== 'published',
  )

  const resultss = await Promise.all([
    // Unpublished pages
    Promise.all(
      unpublishedResources.map(resource =>
        removePage(resource.type, resource, topics),
      ),
    ),
    // Global pages
    writePage('index', null, topics, publishedResources),
    writePage('search', null, topics, publishedResources),
    writePage('aboutUs', null, topics, publishedResources),
    writePage('contact', null, topics, publishedResources),
    writePage('legals', null, topics, publishedResources),
    writePage('sitemap', null, topics, publishedResources),
    // Resources pages
    Promise.all(
      footerResourcesConfig.map(({ slug, types }) =>
        writePage('resources', null, topics, publishedResources, {
          searchTypes: types,
          resourcesSlug: slug,
        }),
      ),
    ),
    // Topic pages
    Promise.all(
      topics.map(topic =>
        writePage('topic', topic, topics, publishedResources),
      ),
    ),
    // Resource pages
    Promise.all(
      resources.map(resource =>
        writePage(resource.type, resource, topics, publishedResources),
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
