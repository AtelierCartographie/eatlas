// shared by Menu and Footer

const { getMediaUrl, footerResourcesConfig } = require('../../universal-utils')

exports.getImageUrl = ({ images }, size = 'medium', density = '1x') => {
  const file = images && images[size] && images[size][density]
  return getMediaUrl(file)
}

exports.getResource = (resources, id) => resources.find(r => r.id === id)

exports.getResourcePageUrl = (resource, topics, { preview = false } = {}) =>
  preview
    ? `/resources/${resource.id}/preview`
    : resource.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

exports.getTopicPageUrl = (topic, { preview = false } = {}) =>
  preview
    ? `/topics/${topic.id}/preview`
    : topic.pageUrl || '#ERROR_UNKNOWN_URL' // TODO load from server?

const globalPageUrl = (key, slug) => preview => {
  if (preview) {
    return '#NO_PREVIEW_FOR_' + key
  }
  // See 'pageUrls' config, each one is injected by server through 'REACT_APP_PAGE_URL_{key}'
  const urlTemplate = process.env['REACT_APP_PAGE_URL_' + key] || ''
  if (!urlTemplate) {
    return '#ERROR_UNKNOWN_GLOBAL_URL_' + key
  }
  return slug ? urlTemplate.replace(/\$resourceSlug/g, slug) : urlTemplate
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
