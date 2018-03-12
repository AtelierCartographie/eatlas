'use strict'

/* eslint no-console:0 */

const { ready, client } = require('../lib/es/client')
const config = require('config')

const listIndices = async () => {
  const indices = await client.cat.indices({ format: 'json' })
  return indices.filter(({ index }) =>
    Object.values(config.es.indices).some(name => index.startsWith(name)),
  )
}

const getAlias = async index => {
  const aliases = await client.indices.getAlias({ index })
  console.log('getAlias', { aliases })
  return Object.keys(aliases)[0]
}

const moveAlias = async (alias, oldIndex, newIndex) => {
  await client.indices.updateAliases({
    body: {
      actions: [
        {
          remove: {
            index: oldIndex,
            alias,
          },
        },
        {
          add: {
            index: newIndex,
            alias,
          },
        },
      ],
    },
  })
}

const showIndices = async () => {
  const indices = await listIndices()
  for (let key in config.es.indices) {
    const name = config.es.indices[key]
    const activeName = await getAlias(name)
    const active = indices.find(({ index }) => index === activeName)
    console.log('## %s: **%s**', key, name)
    console.log('')
    console.log('Active index: **%s** (%s)', active.index, active['store.size'])
    const indexVersions = indices.filter(
      ({ index }) => index.startsWith(name) && index !== activeName,
    )
    if (indexVersions.length > 0) {
      console.log('')
      console.log('Other available versions:')
      console.log('')
      indexVersions.forEach(({ index, 'store.size': size }) => {
        console.log('- **%s** (%s)', index, size)
      })
    }
    console.log('')
  }
  console.log('To switch index version:')
  console.log('``yarn es-index <name key> <version suffix>``')
  console.log('e.g. ``yarn es-index resource 12397987')
  console.log('')
}

const changeVersion = async (key, version) => {
  const alias = config.es.indices[key] || key
  const oldIndex = await getAlias(alias)
  const newIndex = alias + '_' + version
  await moveAlias(alias, oldIndex, newIndex)
  console.log('OK.')
}

const main = async () => {
  if (process.argv.length === 2) {
    showIndices()
  } else if (process.argv.length === 4) {
    changeVersion(process.argv[2], process.argv[3])
  }
}

ready.then(main).catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
