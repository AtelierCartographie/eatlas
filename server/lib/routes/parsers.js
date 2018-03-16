'use strict'

const { download } = require('../google')
const { parseArticle, parseLexicon } = require('../doc-parsers')

const uploadParser = (key, type, parse) => async (req, res) => {
  const { uploads, accessToken } = req.body

  const up = uploads && uploads[0]
  if (!up || up.key !== key) {
    return res.boom.badRequest(`Upload: expecting single "${key}" document`)
  }

  try {
    const buffer = await download(up.fileId, type, up.mimeType, accessToken)
    const result = await parse(buffer)
    res.send(result)
  } catch (err) {
    res.boom.send(err)
  }
}

exports.article = uploadParser('article', 'article', parseArticle)
exports.focus = uploadParser('focus', 'focus', parseArticle)
exports.lexicon = uploadParser('lexicon', 'definition', parseLexicon)
