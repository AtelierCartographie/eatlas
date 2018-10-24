// @flow
// shared by Menu and Footer

const {
  getMediaUrl,
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
    lang = 'fr',
  } /*: FrontOptions */ = {},
) =>
  preview
    ? `${apiUrl || ''}/preview/topics/${topic.id}?lang=${lang}`
    : topic.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

const globalPageUrl = (exports.globalPageUrl = (
  key /*: string */,
  slug /*: string? */,
  hash /*: string? */,
) => ({
  preview = false,
  lang = 'fr',
  apiUrl = process.env.REACT_APP_API_SERVER,
  publicUrl = process.env.REACT_APP_FRONT_URL,
}) => {
  if (preview)
    return hash
      ? `${apiUrl || ''}/preview/${key}?lang=${lang}#${hash}`
      : `${apiUrl || ''}/preview/${key}?lang=${lang}`
  // See 'pageUrls' config, each one is injected by server through 'REACT_APP_PAGE_URL_{key}'
  const urlTemplate = process.env[`REACT_APP_PAGE_URL_${lang}_${key}`] || ''
  if (!urlTemplate) return `#ERROR_UNKNOWN_GLOBAL_URL_${lang}_${key}`
  const url = slug ? urlTemplate.replace(/\$resourcesSlug/g, slug) : urlTemplate
  return hash ? `${publicUrl}/${url}#${hash}` : `${publicUrl}/${url}`
})

const getSearchUrl = (exports.getSearchUrl = (
  params,
  {
    preview = false,
    lang = 'fr',
    apiUrl = process.env.REACT_APP_API_SERVER,
    publicUrl = process.env.REACT_APP_FRONT_URL,
  } /*: FrontOptions */,
) => {
  const url = preview
    ? `${apiUrl || ''}/preview/search`
    : process.env[`REACT_APP_PAGE_URL_${lang}_search`]
      ? `${publicUrl}/${process.env[`REACT_APP_PAGE_URL_${lang}_search`]}`
      : '#ERROR_SEARCH_URL'
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
  return `${url}${qs}`
})

// { resourcesSlug, searchTypes, label }[]
exports.resourcesTypes = [
  {
    text: 'doc.type-plural.map',
    url: options => getSearchUrl({ types: ['map'] }, options),
  },
  {
    text: 'doc.type-plural.image',
    url: options => getSearchUrl({ types: ['image'] }, options),
  },
  {
    text: 'doc.type-plural.focus',
    url: options => getSearchUrl({ types: ['focus'] }, options),
  },
  {
    text: 'doc.type-plural.definition',
    url: globalPageUrl('definition'),
  },
]

exports.aPropos = [
  {
    text: 'home.the-team',
    url: globalPageUrl('index', null, 'team'),
  },
  {
    text: 'home.contact-title',
    url: globalPageUrl('index', null, 'contact'),
  },
  {
    text: 'legals.title',
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
