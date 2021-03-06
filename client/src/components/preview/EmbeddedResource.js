// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const { getResourcePageUrl } = require('./layout')
const { getMediaUrl, stripTags } = require('../../universal-utils')
const Picture = require('./Picture')
const Html = require('./Html')

const EmbeddedResource = injectIntl(({ resource, options, intl }) => {
  switch (resource.type) {
    case 'image':
      return h(Figure, {
        resource,
        options,
        intl,
        mainSize: 'large',
        captionField: 'copyright',
      })

    case 'map':
      return h(Figure, {
        resource,
        options,
        intl,
        mainSize: 'small',
        captionField: 'source',
      })

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
})

const FigCaption = ({ content }) =>
  content ? h(Html, { component: 'figcaption.container' }, content) : null

const Figure = ({ resource, options, intl, mainSize, captionField }) => {
  const infoLink = h(
    'a',
    { href: getResourcePageUrl(resource, options) },
    h(T, { id: 'doc.embedded-download-title' }),
  )
  const description = resource.description_fr
  const title = stripTags(resource.title)
  const caption = resource[captionField] || null
  return h('.Figure', [
    h('figure', [
      h(Html, { component: 'h2.figure-title.container' }, resource.title),
      Picture.Responsive({
        resource,
        options,
        mainSize: 'large',
        alt: '',
      }),
      caption && h(FigCaption, { content: caption }),
    ]),
    h('.ArticleResourceDownload.container', [infoLink]),
    description
      ? h('.ArticleResourceComment.container', [
          h(Html, { component: 'p' }, [
            intl.formatMessage({
              id: 'doc.embedded-description-between-html',
            }),
            description,
          ]),
        ])
      : null,
  ])
}

module.exports = EmbeddedResource
