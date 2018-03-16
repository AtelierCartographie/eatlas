'use strict'

const { resources: Resources } = require('../model')

exports.search = async (req, res) => {
  try {
    const resources = await Resources.list({
      query: { term: { status: 'published' } },
    })
    res.send(resources)
  } catch (err) {
    res.boom.badImplementation(err)
  }
}
