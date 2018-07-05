// @flow
// shared by Menu and Footer

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
  { preview = false } /*: FrontOptions */ = {},
) => {
  if (preview) return getMediaPreviewUrl(id, size, density)

  const file = images && images[size] && images[size][density]
  return getMediaUrl(file)
}

exports.getResourcePageUrl = (
  resource /*: Resource */,
  { preview = false } /*: FrontOptions */ = {},
) =>
  preview
    ? getResourcePagePreviewUrl(resource)
    : resource.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

exports.getTopicPageUrl = (
  topic /*: Topic */,
  { preview = false } /*: FrontOptions */ = {},
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

const getSearchUrl = (exports.getSearchUrl = (params, { preview = false } /*: FrontOptions */) => {
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
    if (Array.isArray(v) && v.length > 0) {
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

exports.resourcesTypes = footerResourcesConfig.map(({ types, label }) => ({
  text: label,
  url: preview => getSearchUrl({ types }, { preview }),
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
