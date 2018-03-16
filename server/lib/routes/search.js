'use strict'

const { resources: Resources } = require('../model')

const sortVal = r => new Date(r.publishedAt)
const sortDir = 'desc'

exports.search = async (req, res) => {
  try {
    const resources = await Resources.list({
      query: { term: { status: 'published' } },
    })
    resources.sort(
      (r1, r2) =>
        sortDir === 'desc'
          ? sortVal(r2) - sortVal(r1)
          : sortVal(r1) - sortVal(r2),
    )
    res.send(resources)
  } catch (err) {
    res.boom.badImplementation(err)
  }
}
