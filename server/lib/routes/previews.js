'use strict'

const { generateHTML } = require('../html-generator')
const { rebuildAssets } = require('../site-builder')

// params.id = resource id
exports.resource = async (req, res, next) => {
  try {
    const resource = req.foundResource
    const key = resource.type
    const options = { preview: true }
    res.send(await generateHTML(key, resource, options))
  } catch (err) {
    next(err)
  }
}

// params.page = key
// query = generator params
exports.page = async (req, res, next) => {
  try {
    const key = req.params.page || 'index'
    const options = { preview: true }
    res.send(await generateHTML(key, null, options))
  } catch (err) {
    next(err)
  }
}

exports.ensureAssets = () => async (req, res, next) => {
  try {
    await rebuildAssets()
    next()
  } catch (err) {
    next(err)
  }
}
