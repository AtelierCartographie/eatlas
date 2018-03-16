'use strict'

const { footerResourcesConfig } = require('../../../client/src/universal-utils')
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

// params.page = key
// query = generator params
exports.page = async (req, res, next) => {
  try {
    const key = req.params.page || 'index'
    const options = { preview: true }
    if (key === 'resources') {
      const validSlugs = footerResourcesConfig.map(({ slug }) => slug)
      if (!req.query.slug || !validSlugs.includes(req.query.slug)) {
        return res.boom.badRequest(
          `Requires ?slug=valid-slug (one of “${validSlugs.join('”, “')}”)`,
        )
      }
      const found = footerResourcesConfig.find(
        ({ slug }) => slug === req.query.slug,
      )
      options.params = {
        searchTypes: found.types,
        resourcesSlug: found.slug,
      }
    }
    res.send(await generateHTML(key, null, options))
  } catch (err) {
    next(err)
  }
}
