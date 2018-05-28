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

// Destroy virtual docs generated when importing this lexicon (related by its id)
const deleteSingleDefinitions = id =>
  deleteByQuery({
    query: {
      bool: {
        must: [
          { term: { type: 'single-definition' } },
          { term: { updatedBy: id } },
        ],
      },
    },
  })

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
      const id = 'LEX' + index
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
  if (found && found.type === 'definition') {
    // Removed lexicon: remove single definitions
    await deleteSingleDefinitions(id)
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
    // Uploaded a full lexicon: create single definitions
    await deleteSingleDefinitions(body.id)
    await insertSingleDefinitions(body)
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
    // Uploaded a full lexicon: create single definitions
    await deleteSingleDefinitions(id)
    await insertSingleDefinitions(Object.assign({}, resource, updates))
  }

  const updated = await update(id, updates)

  if (statusModified) {
    // TODO publish/unpublish business logic (cf. #43)
  }

  return updated
}
