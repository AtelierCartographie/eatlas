'use strict'

const { fullResource, validate } = require('../schemas')

const {
  search,
  find,
  // findOne,
  findById,
  insert,
  update,
  remove,
  deleteByQuery,
} = require('../es/client')('resource')

exports.search = search
exports.list = find
exports.findById = findById

const deleteLinkedVirtualResources = (virtualType, parentResourceId) => {
  deleteByQuery({
    query: {
      bool: {
        must: [
          { term: { type: virtualType } },
          { term: { updatedBy: parentResourceId } },
        ],
      },
    },
  })
}

// Destroy virtual docs generated when importing article
const deleteReferences = id => deleteLinkedVirtualResources('reference', id)

// Create virtual docs when importing an article
const insertReferences = ({
  language,
  status,
  author,
  id: parentResourceId,
  metas,
}) =>
  Promise.all(
    metas
      .filter(m => m.type === 'references')
      .reduce((refs, m) => refs.concat(m.list), [])
      .map(async ({ markup }, index) => {
        const id = 'REF' + parentResourceId + '_' + index
        const link = markup.find(m => m.type === 'link')
        const text = markup.find(m => m.type === 'text')
        if (!link && !text) {
          return // skip corrupted data for reference
        }
        const title = text ? text.text : null
        const url = link ? link.url || link.text : null
        await insert(
          {
            id,
            type: 'reference',
            title: title || url,
            description: url,
            language,
            status,
            author,
            updatedBy: parentResourceId,
            createdAt: new Date(),
          },
          id,
        )
      }),
  )

// Destroy virtual docs generated when importing this lexicon (related by its id)
const deleteSingleDefinitions = id =>
  deleteLinkedVirtualResources('single-definition', id)

// Create virtual docs when importing a lexicon
const insertSingleDefinitions = ({
  definitions,
  language,
  status,
  author,
  id: parentResourceId,
}) =>
  Promise.all(
    definitions.map(async ({ dt, dd, aliases }, index) => {
      const id = 'REF' + parentResourceId + '_' + index
      await insert(
        {
          id,
          type: 'single-definition',
          title: dt,
          description: dd,
          language,
          status,
          author,
          metas: aliases.map(alias => ({
            type: 'alias',
            text: alias,
          })),
          updatedBy: parentResourceId,
          createdAt: new Date(),
        },
        id,
      )
    }),
  )

exports.remove = async id => {
  const found = await findById(id)
  const result = await remove(id)

  if (found) {
    // Remove linked virtual docs
    if (found.type === 'definition') {
      await deleteSingleDefinitions(id)
    }
    if (found.type === 'article' || found.type === 'focus') {
      await deleteReferences(id)
    }
  }

  return result
}

exports.create = async resource => {
  const body = await validate(resource, fullResource)
  const found = await exports.findById(body.id)
  if (found) {
    const error = new Error('Duplicate Name')
    error.code = 'EDUPLICATE'
    throw error
  }

  // Side-effects: create virtual docs
  if (resource.type === 'definition' && resource.definitions) {
    await deleteSingleDefinitions(body.id)
    await insertSingleDefinitions(body)
  }
  if (resource.type === 'article' || resource.type === 'focus') {
    await deleteReferences(body.id)
    await insertReferences(body)
  }

  return await insert(body, body.id)
}

exports.update = async (id, updates) => {
  const resource = await findById(id)

  let statusModified = false
  if (updates.status) {
    if (resource.status !== updates.status) {
      statusModified = true
    }
  }

  // Side-effects: create virtual docs
  if (resource.type === 'definition' && updates.definitions) {
    await deleteSingleDefinitions(id)
    await insertSingleDefinitions(Object.assign({}, resource, updates))
  }
  if (resource.type === 'article' || resource.type === 'focus') {
    await deleteReferences(id)
    await insertReferences(Object.assign({}, resource, updates))
  }

  const updated = await update(id, updates)

  if (statusModified) {
    // TODO publish/unpublish business logic (cf. #43)
  }

  return updated
}
