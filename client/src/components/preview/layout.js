// @flow
// shared by Menu and Footer

/*::
type Options = {
  preview: boolean
}
*/

const {
  getMediaUrl,
  footerResourcesConfig,
  getMediaPreviewUrl,
  getResourcePagePreviewUrl,
} = require('../../universal-utils')

exports.CDN = 'https://cdnjs.cloudflare.com/ajax/libs'

exports.prefixUrl = (url /*: string */, preview /*: boolean */) => {
  const host = preview ? process.env.REACT_APP_ADMIN_URL || '' : ''
  return `${host}${url}`
}

exports.getImageUrl = (
  { id, images },
  size /*: ResourceSize */ = 'medium',
  density /*: ResourceDensity */ = '1x',
  { preview = false } /*: Options */ = {},
) => {
  if (preview) return getMediaPreviewUrl(id, size, density)

  const file = images && images[size] && images[size][density]
  return getMediaUrl(file)
}

exports.getResourcePageUrl = (
  resource /*: Resource */,
  { preview = false } /*: Options */ = {},
) =>
  preview
    ? getResourcePagePreviewUrl(resource)
    : resource.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

exports.getTopicPageUrl = (
  topic /*: Topic */,
  { preview = false } /*: Options */ = {},
) =>
  preview
    ? `/preview/topics/${topic.id}`
    : topic.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

const globalPageUrl = (key /*: string */, slug) => (preview /*: boolean */) => {
  if (preview) return '#NO_PREVIEW_FOR_' + key
  // See 'pageUrls' config, each one is injected by server through 'REACT_APP_PAGE_URL_{key}'
  const urlTemplate = process.env['REACT_APP_PAGE_URL_' + key] || ''
  if (!urlTemplate) return '#ERROR_UNKNOWN_GLOBAL_URL_' + key
  return slug ? urlTemplate.replace(/\$resourcesSlug/g, slug) : urlTemplate
}

const getSearchUrl = (exports.getSearchUrl = (params, { preview = false }) => {
  const url = preview
    ? '/preview/search'
    : process.env['REACT_APP_PAGE_URL_search'] || '#ERROR_SEARCH_URL'
  // Single-level query string (nested objects not supported in search URL)
  const append = (q, k, v) => {
    const prefix = q === '' ? '?' : '&'
    return q + prefix + encodeURIComponent(k) + '=' + encodeURIComponent(v)
  }
  const qs = Object.keys(params).reduce((q, k) => {
    const v = params[k]
    const multiple = 'length' in v && typeof v.reduce === 'function' // array
    if (multiple && v.length > 0) {
      const kk = k + '[]'
      return v.reduce((qq, vv) => append(qq, kk, vv), q)
    } else if (typeof v === 'string' || typeof v === 'number') {
      return append(q, k, String(v))
    } else if (typeof v === 'boolean') {
      return v ? append(q, k, 'on') : q
    } else {
      return q
    }
  }, '')
  return url + qs
})

exports.resourcesTypes = footerResourcesConfig.map(({ slug, label }) => ({
  text: label,
  url: globalPageUrl('resources', slug),
}))

exports.aPropos = [
  {
    text: 'Qui sommes-nous ?',
    url: globalPageUrl('aboutUs'),
  },
  {
    text: 'Nous contacter',
    url: globalPageUrl('contact'),
  },
  {
    text: 'Mentions légales',
    url: globalPageUrl('legals'),
  },
  { text: 'Plan du site', url: globalPageUrl('sitemap') },
]
