'use strict'

const { writeFile, ensureDir, unlink, exists, stat } = require('fs-extra')
const path = require('path')
const { promisify } = require('util')
const config = require('config')
const sitemap = require('sitemap')

const logger = require('./logger')
const { topics: Topics, resources: Resources } = require('./model')
const { pagePath, publicPath, pathToUrl } = require('./resource-path')
const { populatePageUrl } = require('./generator-utils')
const { generateHTML } = require('./html-generator')
const babel = require('babel-core')

const writeFileLogged = async (file, content) => {
  await ensureDir(path.dirname(file))
  try {
    await writeFile(file, content)
    logger.info('WRITE OK', file)
    return { error: null, write: file }
  } catch (err) {
    logger.error('WRITE FAILED (skipped)', err)
    return { error: err, write: file }
  }
}

const writePage = async (key, resource, topics, articles, params) => {
  const file = pagePath(key, resource, topics, params)
  const html = await generateHTML(
    key,
    resource,
    { preview: false, ...params },
    { topics, articles },
  )
  return await writeFileLogged(file, html)
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

const writeRobotsTxt = async () => {
  const file = publicPath('robots.txt')
  const txt = [
    'User-agent: *',
    'Disallow:',
    '',
    `Sitemap: ${config.publicUrl}/sitemap.xml`,
  ].join('\n')
  return await writeFileLogged(file, txt)
}

const writeSitemapXml = async urls => {
  const file = publicPath('sitemap.xml')
  const sm = sitemap.createSitemap({
    hostname: config.publicUrl,
    cacheTime: 3600000,
    urls: urls.map(url => ({
      url,
      changefreq: 'daily',
      priority: 0.5,
    })),
  })
  const getXML = promisify(sm.toXML.bind(sm))
  const xml = await getXML()
  return await writeFileLogged(file, xml)
}

const rebuildLangHTML = async lang => {
  const topics = populatePageUrl('topic', null)(
    await Topics.list({ sort: { id: 'asc' } }),
  )
  const resources = populatePageUrl(null, topics)(
    await Resources.list({
      query: Resources.DEFAULT_LIST_QUERY,
      sort: { id: 'asc' },
    }),
  )
  const publishedResources = resources.filter(
    ({ language, status, type }) =>
      lang === language && status === 'published' && type !== 'definition',
  )
  const unpublishedResources = resources.filter(
    ({ language, status, type }) =>
      lang === language && status !== 'published' && type !== 'definition',
  )
  const articles = publishedResources.filter(({ type }) => type === 'article')
  const params = { lang }

  const resultss = await Promise.all([
    // Unpublished pages
    Promise.all(
      unpublishedResources.map(resource =>
        removePage(resource.type, resource, topics, params),
      ),
    ),
    // Global pages
    writePage('index', null, topics, articles, params),
    writePage('search', null, topics, articles, params),
    writePage('about', null, topics, articles, params),
    writePage('legals', null, topics, articles, params),
    writePage('sitemap', null, topics, articles, params),
    writePage('notFound', null, topics, articles, params),
    writePage('definition', null, topics, articles, params),
    // Topic pages
    Promise.all(
      ([] || topics).map(topic =>
        writePage('topic', topic, topics, articles, params),
      ),
    ),
    // Resource pages
    Promise.all(
      publishedResources.map(resource =>
        writePage(resource.type, resource, topics, articles, params),
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

exports.rebuildAllHTML = async () => {
  const reportFr = await rebuildLangHTML('fr')
  const reportEn = await rebuildLangHTML('en')

  const report = {
    errored: reportFr.errored || reportEn.errored,
    details: reportFr.details.concat(reportEn.details),
  }

  // SEO
  await writeSitemapXml(
    report.details
      .map(({ error, write, noop }) => (error ? null : write || noop))
      .filter(url => url !== null)
      .map(url => pathToUrl(url, false)),
  )
  await writeRobotsTxt()

  return report
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
  const target = path.resolve(
    pubDir,
    path.join('assets', 'js', 'eatlas.es5.js'),
  )
  const [sourceMtime, targetMtime] = await Promise.all(
    [source, target].map(getMTime),
  )
  if (targetMtime >= sourceMtime) {
    // Skip rebuild: target is fresh
    return
  }
  const options = {
    presets: [
      [
        'env',
        {
          targets: {
            browsers: ['last 2 versions', 'safari >= 7'],
          },
        },
      ],
    ],
  }
  const { code } = await compileJS(source, options)

  await writeFile(target, code)
  logger.info('WRITE OK', target)
}
