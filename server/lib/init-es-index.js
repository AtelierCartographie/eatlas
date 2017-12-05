'use strict'

const chalk = require('chalk')
const isEqual = require('lodash.isequal')
const {
  es: {
    autoMigration,
    acceptObsoleteMapping,
    indices,
    indexSettings: settings,
  },
} = require('config')

const indexMapping = Object.keys(indices).reduce(
  (mappings, type) =>
    Object.assign(mappings, {
      [indices[type]]: { [type]: require(`./es-types/${type}.json`) },
    }),
  {},
)

const checkIndex = (client, index) =>
  client.indices
    .exists({ index })
    .then(
      // Create versioned index, and use alias to real index name (this allows easier renaming later)
      found =>
        found ||
        client.indices.create({
          index: index + '_' + Date.now(),
          body: {
            aliases: { [index]: {} },
            settings,
            mappings: indexMapping[index],
          },
        }),
    )
    .then(() => client.indices.get({ index }))
    .then(info => {
      const realIndex = Object.keys(info)[0]
      const params = info[realIndex]
      return { index: realIndex, params }
    })
    .catch(err => {
      const message = 'Server failure: ES index could not be found or created'
      console.error(chalk.bold.red(message)) // eslint-disable-line no-console
      console.error(err) // eslint-disable-line no-console
      process.exit(1)
    })

const upgradeMappings = (client, index, currentMappings, newMappings) => {
  // Mapping unchanged: nothing to do
  if (isEqual(newMappings, currentMappings)) {
    return Promise.resolve(false)
  }
  // Field or mapping to be deleted: trigger full reindex
  const hasDeletedField = Object.keys(currentMappings).some(
    type =>
      !(type in newMappings) ||
      Object.keys(currentMappings[type].properties).some(
        field => !(field in newMappings[type].properties),
      ),
  )
  if (hasDeletedField) {
    return Promise.reject(new Error('FORCE_REINDEX_DROP_FIELD'))
  }
  // Try to just put mapping
  return Promise.all(
    Object.keys(newMappings).map(type =>
      client.indices.putMapping({ index, type, body: newMappings[type] }),
    ),
  ).then(() => 'Simple putMapping')
}

const migrateIndex = (client, index, oldIndex) => {
  const mappings = indexMapping[index]

  console.error(chalk.bold.red('Obsolete mapping')) // eslint-disable-line no-console
  // Disabled auto-migration: reject
  if (!autoMigration) {
    console.error(chalk.bold.red('Automatic index migration: disabled')) // eslint-disable-line no-console
    console.error(chalk.bold('You should manually upgrade mapping ASAP:')) // eslint-disable-line no-console
    console.error(chalk.bold(JSON.stringify(mappings))) // eslint-disable-line no-console
    if (!acceptObsoleteMapping) {
      console.error(chalk.bold.red('Obsolete mapping unaccepted: exit now')) // eslint-disable-line no-console
      process.exit(1)
    } else {
      console.error(chalk.bold('Obsolete mapping accepted')) // eslint-disable-line no-console
    }
    return
  }

  console.error(chalk.bold('Automatic index upgrade…')) // eslint-disable-line no-console
  // Force upgrade mapping by reindexing
  const newIndex = index + '_' + Date.now()

  return client.indices
    .create({ index: newIndex, body: { settings, mappings } })
    .then(() => console.error(chalk.bold(`Reindexing into ${newIndex}…`))) // eslint-disable-line no-console
    .then(() =>
      client.reindex({
        body: { source: { index: oldIndex }, dest: { index: newIndex } },
      }),
    )
    .then(() => renameIndex(client, index, oldIndex, newIndex))
    .then(() => `New index "${newIndex}"`)
}

const renameIndex = (client, alias, oldIndex, newIndex) => {
  if (alias === oldIndex) {
    const message = `Unaliased index: drop ${oldIndex} then alias ${alias} → ${newIndex}…`
    console.error(chalk.bold.red(message)) // eslint-disable-line no-console
    return client.indices.delete({ index: oldIndex }).then(() =>
      client.indices.updateAliases({
        body: { actions: [{ add: { index: newIndex, alias } }] },
      }),
    )
  }
  const message = `Aliased index: update alias ${alias} → ${newIndex}, then drop ${oldIndex}…`
  console.error(chalk.bold(message)) // eslint-disable-line no-console
  return client.indices
    .updateAliases({
      body: {
        actions: [
          { remove: { index: oldIndex, alias } },
          { add: { index: newIndex, alias } },
        ],
      },
    })
    .then(() => client.indices.delete({ index: oldIndex }))
}

const upgradeIndex = (client, index) => ({ index: realIndex, params }) => {
  const message = info => chalk.bold.green(`Updated ${index}: ${info}`)
  return upgradeMappings(
    client,
    realIndex,
    params.mappings,
    indexMapping[index],
  )
    .catch(() => migrateIndex(client, index, realIndex))
    .then(info => info && console.error(message(info))) // eslint-disable-line no-console
}

const initIndex = (client, index) =>
  checkIndex(client, index)
    .then(upgradeIndex(client, index))
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      console.error(chalk.bold.red('Server failure: obsolete mapping')) // eslint-disable-line no-console
      console.error(chalk.bold.red('Automatic migration failed')) // eslint-disable-line no-console
      process.exit(1)
    })

module.exports = (client, indices) =>
  Promise.all(
    Object.keys(indices).map(type => initIndex(client, indices[type])),
  )
