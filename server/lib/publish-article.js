'use strict'

const path = require('path')
const { writeFile, ensureDir, unlink, exists } = require('fs-extra')
const { generateArticleHTML } = require('./article-utils')
const resourcePath = require('./resource-path')

// TODO slugify title?
// TODO handle all associated files (maybe all html?)

exports.publishArticle = async resource => {
  const filePath = exports.articleFullPath(resource)
  await ensureDir(path.dirname(filePath))
  const html = await generateArticleHTML(resource)
  await writeFile(filePath, html)
}

exports.unpublishArticle = async resource => {
  const filePath = exports.articleFullPath(resource)
  if (await exists(filePath)) {
    await unlink(filePath)
  }
}

exports.articleFullPath = resource =>
  resourcePath(resource, null, { up: false }).pub
