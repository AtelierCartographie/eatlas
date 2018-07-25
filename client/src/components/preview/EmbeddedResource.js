// @flow

const h = require('react-hyperscript')

const { getImageUrl, getResourcePageUrl } = require('./layout')
const { getMediaUrl } = require('../../universal-utils')

const srcset = (image, size, options) => {
  const image1 = getImageUrl(image, size, '1x', options)
  const image2 = getImageUrl(image, size, '2x', options)
  const image3 = getImageUrl(image, size, '3x', options)
  if (!image1 && !image2 && !image3) {
    if (options.fallback) {
      return (
        srcset(image, 'large', { ...options, fallback: false }) ||
        srcset(image, 'medium', { ...options, fallback: false }) ||
        srcset(image, 'small', { ...options, fallback: false })
      )
    }
    return null
  }
  return [
    image1 ? `${image1},` : '',
    image2 ? `${image2} 2x,` : '',
    image3 ? `${image3} 3x,` : '',
  ].join('\n')
}

const EmbeddedResource = ({ resource, options }) => {
  const infoLink = h(
    'a',
    { href: getResourcePageUrl(resource, options) },
    'Info & téléchargement',
  )

  switch (resource.type) {
    case 'image':
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        Picture({
          resource,
          options,
          main: { component: 'img.img-responsive', size: 'large' },
          sources: [{ size: 'large', minWidth: 0 }],
        }),
        h(FigCaption, { content: resource.copyright }),
        h('.ArticleResourceDownload', [infoLink]),
        h(ArticleResourceComment, { resource }),
      ])

    case 'map':
      return h('figure', [
        h('h2.figure-title.container', resource.title),
        Picture({
          resource,
          options,
          main: { component: 'img', size: 'small' },
          sources: [
            { size: 'large', minWidth: '700px' },
            { size: 'medium', minWidth: '560px' },
            { size: 'small', minWidth: 0 },
          ],
        }),
        h(FigCaption, { content: resource.copyright }),
        h('.ArticleResourceDownload.container', [infoLink]),
        h(ArticleResourceComment, { resource }),
      ])

    case 'video': {
      const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('iframe', {
          title: resource.title,
          src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
          frameBorder: 0,
          height: 420,
          width: 740,
          allowFullScreen: true,
        }),
        h(FigCaption, { content: resource.description }),
      ])
    }

    case 'sound': {
      const url = getMediaUrl(resource.file)
      return h('figure.container', [
        h('h2.figure-title', resource.title),
        h('audio', {
          src: url,
          controls: true,
        }),
        h(FigCaption, { content: resource.description }),
      ])
    }

    case 'focus':
      return h('.container.ArticleFocus', [
        h('div', [
          h(
            'a',
            {
              href: getResourcePageUrl(resource, options),
            },
            [h('.FocusIcon', 'Focus'), resource.title],
          ),
        ]),
      ])

    default:
      return null
  }
}

const ArticleResourceComment = ({ resource }) => {
  if (!resource.description) return null
  const id = `comment-${resource.id}`
  return h('.ArticleResourceComment.container', [
    h(
      'a',
      {
        href: `#${id}`,
        'data-toggle': 'collapse',
        role: 'button',
        'aria-controls': id,
        'aria-expanded': false,
        'aria-haspopup': true,
      },
      'Commentaire',
    ),
    h('.collapse', { id }, [
      h('div', { dangerouslySetInnerHTML: { __html: resource.description } }),
    ]),
  ])
}

const Picture = ({
  resource,
  options,
  main: { component, size },
  sources = [],
}) =>
  h('picture', [
    ...sources.map(({ size, minWidth }, key) => {
      const srcSet = srcset(resource, size, options)
      if (!srcSet) return null
      const more = minWidth ? { media: `(min-width: ${minWidth})` } : {}
      return h('source', { key, srcSet, ...more })
    }),
    h(component, {
      srcSet: srcset(resource, size, { ...options, fallback: true }),
    }),
  ])

const FigCaption = ({ content }) =>
  h('figcaption.container', { dangerouslySetInnerHTML: { __html: content } })

module.exports = EmbeddedResource
