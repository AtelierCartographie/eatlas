'use strict'

const { ready } = require('../lib/es/client')
const { rebuildAllHTML, rebuildAssets } = require('../lib/site-builder')
const { resources: Resources } = require('../lib/model')
const { updateFiles } = require('../lib/public-fs')
const logger = require('../lib/logger')

const main = async () => {
  logger.info('1. Rebuild assets')
  await rebuildAssets()

  logger.info('2. Rebuild all HTML contents')
  let report = {}

  logger.info('2.a. French')
  report = await rebuildAllHTML('fr')
  if (report.errored) {
    logger.error(report.details)
    throw new Error('Errors occured')
  }

  logger.info('2.b. English')
  report = await rebuildAllHTML('en')
  if (report.errored) {
    logger.error(report.details)
    throw new Error('Errors occured')
  }

  logger.info('3. Handle media files')
  const resources = await Resources.list()
  for (let resource of resources) {
    await updateFiles(resource)
  }

  logger.info('4. Profit')
}

ready.then(main).catch(err => {
  logger.fatal(err)
  process.exit(1)
})
