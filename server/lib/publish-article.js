'use strict'

const path = require('path')
const { writeFile, ensureDir, unlink } = require('fs-extra')
const { generateArticleHTML, articleFileName } = require('./article-utils')
const getConf = require('./dynamic-config-variable')

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
  await unlink(filePath)
}

exports.articleFullPath = resource => {
  const fileName = articleFileName(resource)
  const dir = getConf('publicPath.' + resource.type)
  const absDir = path.resolve(__dirname, '..', dir)
  return path.join(absDir, fileName)
}
