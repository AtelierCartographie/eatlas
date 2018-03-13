'use strict'

const { download } = require('../google')
const { parseDocx } = require('../doc-parser')
const { parseLexicon } = require('../lexicon-parser')

const uploadParser = (key, parse) => async (req, res) => {
  const { uploads, accessToken } = req.body

  const up = uploads && uploads[0]
  if (!up || up.key !== key) {
    return res.boom.badRequest(`Upload: expecting single "${key}" document`)
  }

  try {
    const buffer = await download(up.fileId, key, up.mimeType, accessToken)
    const result = await parse(buffer)
    res.send(result)
  } catch (err) {
    res.boom.send(err)
  }
}

exports.article = uploadParser('article', parseDocx)
exports.focus = uploadParser('focus', parseDocx)
exports.lexicon = uploadParser('lexicon', parseLexicon)
