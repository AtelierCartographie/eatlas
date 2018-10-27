const { getUrl, getFirstImageKey } = require('./generator-utils')
const {
  getMediaPreviewUrl,
  getMediaUrl,
} = require('../../client/src/universal-utils')

const getImageUrl = (resource, size, density, preview) =>
  resource
    ? preview
      ? getMediaPreviewUrl(resource.id, size, density)
      : getMediaUrl(resource.images[size][density])
    : ''

const getSmallestImageUrl = (resource, preview) => {
  if (!resource) return ''
  const found = getFirstImageKey(resource.images)
  if (!found) return ''
  return getImageUrl(resource, found.size, found.density, preview)
}

const getResourceSocialMetaImage = (resource, resources, preview) => {
  switch (resource.type) {
    case 'focus':
      if (!resource.relatedArticle) return ''
      return getResourceSocialMetaImage(
        resource.relatedArticle,
        resources,
        preview,
      )
    case 'article':
      return getSmallestImageUrl(
        resources.find(r => r.id === resource.imageHeader),
        preview,
      )
    case 'map':
    case 'image':
      return getSmallestImageUrl(resource, preview)
    default:
      return ''
  }
}

const buildResourceSocialMetas = (resource, lang, { props, preview }) => ({
  description:
    resource[`description_${lang}`] ||
    resource[`description_${lang === 'fr' ? 'en' : 'fr'}`],
  image: getResourceSocialMetaImage(resource, props.resources, preview),
})

const buildTopicSocialMetas = (topic, lang, { props, preview }) => {
  const resource = props.resources.find(
    r => r.id === topic.resourceId && (r.status === 'published' || preview),
  )
  const image = (resource &&
    resource.type === 'image' &&
    getImageUrl(resource, 'large', '1x', preview)) || {
    id: 'fo.page-image.topic',
  }
  const description =
    topic[`description_${lang}`] ||
    topic[`description_${lang === 'fr' ? 'en' : 'fr'}`]
  return { description, image }
}

const buildPageSocialMetas = page => ({
  description: { id: `fo.page-description.${page}` },
  image: { id: `fo.page-image.${page}` },
})

module.exports = async ({
  resource,
  page,
  topic,
  lang,
  topics,
  preview,
  props,
}) =>
  Object.assign(
    resource
      ? buildResourceSocialMetas(resource, lang, { props, preview })
      : topic
        ? buildTopicSocialMetas(topic, lang, { props, preview })
        : buildPageSocialMetas(page, lang, { props, preview }),
    { url: await getUrl({ page, resource, topic, topics, preview, lang }) },
  )
