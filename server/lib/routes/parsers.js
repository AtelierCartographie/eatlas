'use strict'

const { download } = require('../google')
const { parseDocx } = require('../doc-parser')

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
