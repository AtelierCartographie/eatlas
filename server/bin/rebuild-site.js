'use strict'

const { ready } = require('../lib/es/client')
const { rebuildAllHTML } = require('../lib/site-builder')
const { resources: Resources } = require('../lib/model')
const { updateFiles } = require('../lib/public-fs')
const logger = require('../lib/logger')

const main = async () => {
  logger.info('1. Rebuild all HTML contents')
  const report = await rebuildAllHTML()
  if (report.errored) {
    logger.error(report.details)
    throw new Error('Errors occured')
  }

  logger.info('2. Handle media files')
  const resources = await Resources.list()
  for (let resource of resources) {
    await updateFiles(resource)
  }

  logger.info('3. Done')
}

ready.then(main).catch(err => {
  logger.fatal(err)
  process.exit(1)
})
