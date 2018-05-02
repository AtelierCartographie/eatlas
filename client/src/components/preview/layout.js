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
  size = 'medium',
  density = '1x',
  { preview = false } = {},
) => {
  if (preview) return getMediaPreviewUrl(id, size, density)

  const file = images && images[size] && images[size][density]
  return getMediaUrl(file)
}

exports.getResourcePageUrl = (resource /*: Resource */, { preview = false } = {}) =>
  preview
    ? getResourcePagePreviewUrl(resource)
    : resource.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

exports.getTopicPageUrl = (topic /*: Topic */, { preview = false } = {}) =>
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
