// @flow

const h = require('react-hyperscript')

const { getResourcePageUrl } = require('./layout')
const { getMediaUrl } = require('../../universal-utils')
const Picture = require('./Picture')

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
        Picture.Responsive({ resource, options, mainSize: 'large' }),
        h(FigCaption, { content: resource.copyright }),
        h('.ArticleResourceDownload', [infoLink]),
        h(ArticleResourceComment, { resource }),
      ])

    case 'map':
      return h('figure', [
        h('h2.figure-title.container', resource.title),
        Picture.Responsive({ resource, options, mainSize: 'small' }),
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

const FigCaption = ({ content }) =>
  h('figcaption.container', { dangerouslySetInnerHTML: { __html: content } })

module.exports = EmbeddedResource
