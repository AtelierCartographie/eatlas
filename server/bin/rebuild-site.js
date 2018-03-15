'use strict'

const { ready } = require('../lib/es/client')
const { rebuildFullSite } = require('../lib/site-builder')

const main = async () => {
  const report = await rebuildFullSite()
  if (report.errored) {
    console.error(report.details) // eslint-disable-line no-console
    throw new Error('Errors occured')
  }
}

ready.then(main).catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
