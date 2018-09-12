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
  const file = images && images[size] && images[size][density]
  if (!file) return null
  if (preview) return getMediaPreviewUrl(id, size, density)
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
  {
    preview = false,
    apiUrl = process.env.REACT_APP_API_SERVER,
  } /*: FrontOptions */ = {},
) =>
  preview
    ? `${apiUrl || ''}/preview/topics/${topic.id}`
    : topic.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

const globalPageUrl = (exports.globalPageUrl = (
  key /*: string */,
  slug /*: string? */,
  hash /*: string? */,
) => ({
  preview /*: boolean */,
  apiUrl = process.env.REACT_APP_API_SERVER,
}) => {
  if (preview)
    return hash
      ? `${apiUrl || ''}/preview/${key}#${hash}`
      : `${apiUrl || ''}/preview/${key}`
  // See 'pageUrls' config, each one is injected by server through 'REACT_APP_PAGE_URL_{key}'
  const urlTemplate = process.env['REACT_APP_PAGE_URL_' + key] || ''
  if (!urlTemplate) return '#ERROR_UNKNOWN_GLOBAL_URL_' + key
  const url = slug ? urlTemplate.replace(/\$resourcesSlug/g, slug) : urlTemplate
  return hash ? `${url}#${hash}` : url
})

const getSearchUrl = (exports.getSearchUrl = (
  params,
  {
    preview = false,
    apiUrl = process.env.REACT_APP_API_SERVER,
  } /*: FrontOptions */,
) => {
  const url = preview
    ? `${apiUrl || ''}/preview/search`
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

exports.resourcesTypes = footerResourcesConfig.map(
  ({ types, label, page }) => ({
    text: label,
    url: page
      ? globalPageUrl(...page)
      : options => getSearchUrl({ types }, options),
  }),
)

exports.aPropos = [
  {
    text: 'Le projet',
    url: globalPageUrl('about', null, 'project'),
  },
  {
    text: "L'équipe",
    url: globalPageUrl('about', null, 'team'),
  },
  {
    text: 'Nous contacter',
    url: globalPageUrl('about', null, 'contact'),
  },
  {
    text: 'Mentions légales',
    url: globalPageUrl('legals'),
  },
]

exports.articleHeaderImageUrl = (article, options) =>
  article &&
  article.imageHeader &&
  // TODO densities
  `url(${exports.getImageUrl(article.imageHeader, 'small', '1x', options) ||
    exports.getImageUrl(article.imageHeader, 'medium', '1x', options) ||
    exports.getImageUrl(article.imageHeader, 'large', '1x', options)})`

exports.ensureHTML = (string, tag = 'p') => {
  if (!string.match(/^\s*</)) {
    return `<${tag}>${string}</${tag}>`
  }
  return string
}
