'use strict'

/* eslint no-console:0 */

const path = require('path')

const { ready } = require('../lib/es/client')
const { resources: Resources } = require('../lib/model')
const uploadManagers = require('../lib/upload-managers')
const getConf = require('../lib/dynamic-config-variable')
const {
  publishArticle,
  unpublishArticle,
  articleFullPath,
} = require('../lib/publish-article')
const { exists, copy, unlink } = require('fs-extra')

const main = async () => {
  const resources = await Resources.list()
  console.log('%s resource(s)...', resources.length)
  for (let resource of resources) {
    await checkFiles(resource)
  }
}

const checkFiles = async resource => {
  const { files: getFiles } = uploadManagers[resource.type]
  const files = getFiles(resource)

  if (files.length > 0) {
    for (let file of files) {
      if (resource.status === 'published') {
        checkPublishedFile(resource, file)
      } else {
        checkUnpublishedFile(resource, file)
      }
    }
  } else if (resource.type === 'article' || resource.type === 'focus') {
    // No file, but special case: article and focus have no uploaded HTML but are generated on demand
    const pub = articleFullPath(resource)
    if (resource.status === 'published') {
      if (!await exists(pub)) {
        console.warn('%s: missing public (generate %s)', resource.id, pub)
        try {
          await publishArticle(resource)
        } catch (err) {
          console.error(
            '%s: FAILED PUBLISHING HTML (%s)',
            resource.id,
            err.stack,
          )
        }
      }
    } else {
      if (await exists(pub)) {
        console.warn('%s: extra public (unpublish %s)', resource.id, pub)
        try {
          await unpublishArticle(resource)
        } catch (err) {
          console.error(
            '%s: FAILED UNPUBLISHING HTML (%s)',
            resource.id,
            err.stack,
          )
        }
      }
    }
  }
}

const checkPublishedFile = async (resource, file) => {
  const { up, pub } = getFilePaths(resource, file)
  if (await exists(up)) {
    if (await exists(pub)) {
      // Everything's OK
    } else {
      // Missing public file
      console.warn('%s: missing public (%s => %s)', resource.id, up, pub)
      await copy(up, pub)
    }
  } else {
    // oops! no file in 'uploads' dir
    if (await exists(pub)) {
      // Missing original file but public exists
      console.warn('%s: missing upload (%s => %s)', resource.id, pub, up)
      await copy(pub, up)
    } else {
      // Everything's NOT OK: I can't fix it :(
      console.error('%s: MISSING UPLOAD AND PUBLISHED: UNFIXABLE!')
    }
  }
}

const checkUnpublishedFile = async (resource, file) => {
  const { up, pub } = getFilePaths(resource, file)
  if (!await exists(up)) {
    if (await exists(pub)) {
      // Missing original file but public exists
      console.warn('%s: missing upload (%s => %s)', resource.id, pub, up)
      await copy(pub, up)
    } else {
      // Everything's NOT OK: I can't fix it :(
      console.error('%s: MISSING UPLOAD AND PUBLISHED: UNFIXABLE!')
    }
  }
  if (await exists(pub)) {
    // oops! file should not be public
    console.warn('%s: extra public (delete %s)', resource.id, pub)
    await unlink(pub)
  }
}

const getFilePaths = (resource, file) => {
  const upDir = path.resolve(__dirname, '..', getConf('uploadPath', {}))
  const pubDir = path.resolve(
    __dirname,
    '..',
    getConf('publicPath.' + resource.type),
  )
  return { pub: path.join(pubDir, file), up: path.join(upDir, file) }
}

ready.then(main).catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
