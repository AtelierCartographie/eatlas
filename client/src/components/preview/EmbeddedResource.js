// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T } = require('react-intl')

const { getResourcePageUrl } = require('./layout')
const { getMediaUrl, stripTags } = require('../../universal-utils')
const Picture = require('./Picture')
const Html = require('./Html')

const EmbeddedResource = ({ resource, options }) => {
  const infoLink = h(
    'a',
    { href: getResourcePageUrl(resource, options) },
    h(T, { id: 'doc.embedded-download-title' }),
  )

  switch (resource.type) {
    case 'image':
      return h('figure', [
        h(Html, { component: 'h2.figure-title.container' }, resource.title),
        Picture.Responsive({ resource, options, mainSize: 'large' }),
        h(FigCaption, { content: resource.copyright }),
        h('.ArticleResourceDownload.container', [infoLink]),
        h(ArticleResourceComment, { resource }),
      ])

    case 'map':
      return h('figure', [
        h(Html, { component: 'h2.figure-title.container' }, resource.title),
        Picture.Responsive({ resource, options, mainSize: 'small' }),
        h(FigCaption, { content: resource.source }),
        h('.ArticleResourceDownload.container', [infoLink]),
        h(ArticleResourceComment, { resource }),
      ])

    case 'video': {
      const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
      return h('figure.container', [
        h(Html, { component: 'h2.figure-title' }, resource.title),
        h('iframe', {
          title: stripTags(resource.title),
          src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
          frameBorder: 0,
          height: 420,
          width: 740,
          allowFullScreen: true,
        }),
        h(FigCaption, { content: stripTags(resource.description_fr) }),
      ])
    }

    case 'sound': {
      const url = getMediaUrl(resource.file)
      return h('figure.container', [
        h(Html, { component: 'h2.figure-title' }, resource.title),
        h('audio', {
          src: url,
          controls: true,
        }),
        h(FigCaption, { content: stripTags(resource.description_fr) }),
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
            [h('.FocusIcon', 'Focus'), h(Html, {}, resource.title)],
          ),
        ]),
      ])

    default:
      return null
  }
}

const ArticleResourceComment = ({ resource }) => {
  const description =
    resource[`description_${resource.language}`] || resource.description_fr
  if (!description) return null
  return h('.ArticleResourceComment.container', [
    h('.gradient-expand', {}, [
      h('strong.comment-title', {}, h(T, { id: 'doc.comment' })),
      h(Html, { component: 'p' }, description),
      h('.read-more', ['▼']),
    ]),
  ])
}

const FigCaption = ({ content }) =>
  content ? h(Html, { component: 'figcaption.container' }, content) : null

module.exports = EmbeddedResource
