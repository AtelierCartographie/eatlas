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
      return h(Figure, { resource, options, intl, mainSize: 'large' })

    case 'map':
      return h(Figure, { resource, options, intl, mainSize: 'small' })

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

const Figure = ({ resource, options, intl, mainSize }) => {
  const infoLink = h(
    'a',
    { href: getResourcePageUrl(resource, options) },
    h(T, { id: 'doc.embedded-download-title' }),
  )
  const description = resource[`description_${intl.lang}`]
  return h('.Figure', [
    h('figure', [
      h(Html, { component: 'h2.figure-title.container' }, resource.title),
      Picture.Responsive({
        resource,
        options,
        mainSize: 'large',
        alt: description
          ? intl.formatMessage(
              { id: 'doc.embedded-alt' },
              { title: resource.title },
            )
          : '',
      }),
      h(FigCaption, { content: resource.copyright }),
    ]),
    h('.ArticleResourceDownload.container', [infoLink]),
    description
      ? h('.ArticleResourceComment.container', [
          h('.gradient-expand', {}, [
            h(
              Html,
              { component: 'p' },
              intl.formatMessage(
                { id: 'doc.embedded-description-html' },
                { description, title: resource.title },
              ),
            ),
            h('button.read-more', [
              intl.formatMessage({ id: 'doc.embedded-read-more' }),
              h('span', { 'aria-hidden': true }, ' ▼'),
            ]),
          ]),
        ])
      : null,
  ])
}

module.exports = EmbeddedResource
