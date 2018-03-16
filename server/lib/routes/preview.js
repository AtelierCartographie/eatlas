'use strict'

const { generateHTML } = require('../html-generator')

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
