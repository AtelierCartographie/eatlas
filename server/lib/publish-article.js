'use strict'

const path = require('path')
const { writeFile, ensureDir, unlink, exists } = require('fs-extra')
const { generateArticleHTML, generateFocusHTML } = require('./resource-utils')
const resourcePath = require('./resource-path')
const debugFs = require('debug')('eatlas:fs')

// TODO slugify title?
// TODO handle all associated files (maybe all html?)
// TODO Focus: update related-article

exports.publishArticle = async resource => {
  const filePath = exports.articleFullPath(resource)
  await ensureDir(path.dirname(filePath))
  const generateHTML =
    resource.type === 'focus' ? generateFocusHTML : generateArticleHTML
  const html = await generateHTML(resource, { preview: false })
  debugFs('Write', filePath)
  await writeFile(filePath, html)
  return resource
}

exports.unpublishArticle = async resource => {
  const filePath = exports.articleFullPath(resource)
  if (await exists(filePath)) {
    debugFs('Remove', filePath)
    await unlink(filePath)
  }
  return resource
}

exports.articleFullPath = resource =>
  resourcePath(resource, null, { up: false }).pub
