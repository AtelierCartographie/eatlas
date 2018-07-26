const esClient = require('../lib/es/client')
const { find: listTopics, update: updateTopic } = esClient('topic')
const { find: listResources, update: updateResource } = esClient('resource')

;(async () => {
  const topics = await listTopics()
  for (const topic of topics) {
    if ('description' in topic) {
      process.stdout.write(`Topic #${topic.id}: remove field "description"\n`)
      await updateTopic(topic.id, { script: `ctx._source.remove('description')` }, true)
    }
    if (!('description_fr' in topic)) {
      process.stdout.write(`Topic #${topic.id}: add field "description_fr"\n`)
      await updateTopic(topic.id, { description_fr: topic.description || '' })
    }
    if (!('description_en' in topic)) {
      process.stdout.write(`Topic #${topic.id}: add field "description_en"\n`)
      await updateTopic(topic.id, { description_en: '' })
    }
  }
  const resources = await listResources()
  for (const resource of resources) {
    if ('description' in resource) {
      process.stdout.write(`Resource #${resource.id} (${resource.type}): remove field "description"\n`)
      await updateResource(resource.id, { script: `ctx._source.remove('description')` }, true)
    }
    if (!('description_fr' in resource)) {
      process.stdout.write(`Resource #${resource.id} (${resource.type}): add field "description_fr"\n`)
      await updateResource(resource.id, { description_fr: resource.description || '' })
    }
    if (!('description_en' in resource)) {
      process.stdout.write(`Resource #${resource.id} (${resource.type}): add field "description_en"\n`)
      await updateResource(resource.id, { description_en: '' })
    }
  }
})()
.then(() => {
  process.exit(0)
})
.catch(err => {
  process.stderr.write(err.stack)
  process.exit(1)
})
