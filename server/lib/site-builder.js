'use strict'

const { writeFile, ensureDir, unlink, exists, stat } = require('fs-extra')
const path = require('path')
const { promisify } = require('util')

const logger = require('./logger')
const { topics: Topics, resources: Resources } = require('./model')
const { pagePath } = require('./resource-path')
const { populatePageUrl } = require('./generator-utils')
const { generateHTML } = require('./html-generator')
const babel = require('babel-core')

const writePage = async (key, resource, topics, articles, params) => {
  const file = pagePath(key, resource, topics, params)
  const html = await generateHTML(
    key,
    resource,
    { preview: false, ...params },
    { topics, articles },
  )
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
    writePage('project', null, topics, articles),
    writePage('team', null, topics, articles),
    writePage('book', null, topics, articles),
    writePage('legals', null, topics, articles),
    writePage('sitemap', null, topics, articles),
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

const compileJS = promisify(babel.transformFile)

const getMTime = async file => {
  try {
    const { mtime } = await stat(file)
    return mtime
  } catch (err) {
    return 0
  }
}

exports.rebuildAssets = async () => {
  // Compile 'eatlas.js' into 'eatlas.es5.js'
  const pubDir = path.join(__dirname, '..', '..', 'client', 'public') // FIXME should we read from config here?
  const source = path.resolve(pubDir, path.join('assets', 'js', 'eatlas.js'))
  const target = path.resolve(pubDir, path.join('assets', 'js', 'eatlas.es5.js'))
  const [sourceMtime, targetMtime] = await Promise.all([source, target].map(getMTime))
  if (targetMtime >= sourceMtime) {
    // Skip rebuild: target is fresh
    return
  }
  const options = {
    presets: [
      ['env', {
        targets: {
          browsers: ['last 2 versions', 'safari >= 7']
        },
      }],
    ],
  }
  const { code } = await compileJS(source, options)

  await writeFile(target, code)
  logger.info('WRITE OK', target)
}
