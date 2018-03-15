// shared by Menu and Footer

const { getMediaUrl } = require('../../universal-utils')

exports.getImageUrl = ({ images }, size = 'medium', density = '1x') => {
  const file = images && images[size] && images[size][density]
  return getMediaUrl(file)
}

exports.getResource = (resources, id) => resources.find(r => r.id === id)

exports.getResourcePageUrl = (resource, topics, { preview = false } = {}) =>
  preview
    ? `/resources/${resource.id}/preview`
    : resource.pageUrl || '#ERROR_UNKNOWN_URL'

exports.getTopicPageUrl = (topic, { preview = false } = {}) =>
  preview
    ? `/topics/${topic.id}/preview`
    : topic.pageUrl || '#ERROR_UNKNOWN_URL'

exports.resourcesTypes = [
  {
    text: 'Cartes et diagrammes',
    url: preview => (preview ? '#NO_PREVIEW' : 'TODO'),
  },
  {
    text: 'Photos et vidéos',
    url: preview => (preview ? '#NO_PREVIEW' : 'TODO'),
  },
  { text: 'Focus', url: preview => (preview ? '#NO_PREVIEW' : 'TODO') },
  { text: 'Lexique', url: preview => (preview ? '#NO_PREVIEW' : 'TODO') },
  { text: 'Références', url: preview => (preview ? '#NO_PREVIEW' : 'TODO') },
]

exports.aPropos = [
  {
    text: 'Qui sommes-nous ?',
    url: preview => (preview ? '#NO_PREVIEW' : 'TODO'),
  },
  {
    text: 'Nous contacter',
    url: preview => (preview ? '#NO_PREVIEW' : 'TODO'),
  },
  {
    text: 'Mentions légales',
    url: preview => (preview ? '#NO_PREVIEW' : 'TODO'),
  },
  { text: 'Plan du site', url: preview => (preview ? '#NO_PREVIEW' : 'TODO') },
]
