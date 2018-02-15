'use strict'

const { download } = require('../google')
const { parseDocx } = require('../doc-parser')
const { parseLexicon } = require('../lexicon-parser')

exports.article = async (req, res) => {
  const { uploads, accessToken } = req.body

  const up = uploads && uploads[0]
  if (!up || up.key !== 'article') {
    return res.boom.badRequest('Upload: expecting single "article" document')
  }

  try {
    res.send(
      await parseDocx(
        await download(up.fileId, 'article', up.mimeType, accessToken),
      ),
    )
  } catch (err) {
    res.boom.send(err)
  }
}

exports.lexicon = async (req, res) => {
  const { uploads, accessToken } = req.body

  const up = uploads && uploads[0]
  if (!up || up.key !== 'lexicon') {
    return res.boom.badRequest('Upload: expecting single "lexicon" document')
  }

  try {
    res.send(
      await parseLexicon(
        await download(up.fileId, 'lexicon', up.mimeType, accessToken),
      ),
    )
  } catch (err) {
    res.boom.send(err)
  }
}
