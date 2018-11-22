// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Fragment } = require('react')
const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const { globalPageUrl } = require('./layout')
const { stripTags } = require('../../universal-utils')

const Head = require('./Head')
const Body = require('./Body')
const Picture = require('./Picture')
const Html = require('./Html')
const { ArticleSeeAlso } = require('./ArticlePage')

// subcomponents

const apiBaseUrl = process.env.REACT_APP_API_SERVER || ''

const ResourceMap = ({ resource, options }) => {
  return h('.ResourceMap', [
    Picture.Responsive({ resource, options, mainSize: 'large' }),
  ])
}

const ResourceImage = ({ resource, options }) => {
  return h('.ResourceImage', [
    Picture.Responsive({ resource, options, mainSize: 'large' }),
  ])
}

const ResourceSound = ({ resource }) => {
  return h('.container.ResourceSound', [
    h('audio', {
      src: `${apiBaseUrl}/resources/${resource.id}/file`,
      controls: true,
    }),
  ])
}

const ResourceVideo = ({ resource }) => {
  if (!resource.mediaUrl) return null
  const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
  return h('.container.ResourceVideo', [
    h('iframe', {
      title: stripTags(resource.title),
      src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
      frameBorder: 0,
      allowFullScreen: true,
    }),
  ])
}

const ResourceDescription = ({ resource }) => {
  return h('.container.ResourceDescription', [
    h('h2', {}, h(T, { id: 'doc.comment' })),
    h(Html, { whitelist: 'all', noP: true }, resource.description_fr),
  ])
}

const ResourceCopyright = ({ resource }) =>
  !resource.copyright
    ? null
    : h(Html, { component: '.container.ResourceCopyright' }, resource.copyright)

const ResourceTranscript = ({ resource }) =>
  !resource.transcript
    ? null
    : h('.container.ResourceTranscript', [
        h('h2', {}, h(T, { id: 'doc.transcription' })),
        h(Html, {}, resource.transcript),
      ])

const ResourceImageDownload = injectIntl(({ resource, options, intl }) => {
  const large =
    resource.imageStats['large-3x'] ||
    resource.imageStats['large-2x'] ||
    resource.imageStats['large-1x']
  const medium =
    resource.imageStats['medium-3x'] ||
    resource.imageStats['medium-2x'] ||
    resource.imageStats['medium-1x']
  const small =
    resource.imageStats['small-3x'] ||
    resource.imageStats['small-2x'] ||
    resource.imageStats['small-1x']
  return h('.container.ResourceDownload', [
    h('h2', {}, h(T, { id: 'doc.download' })),
    resource.type == 'map'
      ? h(
        Html,
        { whitelist: 'all', noP: true, component: '.warning' },
        intl.formatHTMLMessage(
          { id: 'doc.download-warning-map' },
          { href: 'https://goo.gl/forms/ei1BDbWq7CDQmwfL2' },
        ),
      )
      : h(
        Html,
        { whitelist: 'all', noP: true, component: '.warning' },
        intl.formatHTMLMessage(
          { id: 'doc.download-warning' },
          { href: globalPageUrl('legals')(options) },
        ),
      ),
    h('.download-blocks', [
      large
        ? ResourceImageDownloadBlock({
            resource,
            title: intl.formatMessage({ id: 'doc.download-size.large' }),
            stats: large,
          })
        : null,
      medium
        ? ResourceImageDownloadBlock({
            resource,
            title: intl.formatMessage({ id: 'doc.download-size.medium' }),
            stats: medium,
          })
        : null,
      small
        ? ResourceImageDownloadBlock({
            resource,
            title: intl.formatMessage({ id: 'doc.download-size.small' }),
            stats: small,
          })
        : null,
    ]),
  ])
})

const ResourceImageDownloadBlock = ({
  resource,
  title,
  stats: { type, humanSize, width, height, url },
}) =>
  h('.download-block', [
    h('img.download-preview', { src: url }),
    h('.download-info', [
      h('strong', title),
      h('a', { href: url, download: `${resource.id} - ${title}.${type}` }, [
        h('span.link', {}, h(T, { id: 'doc.do-download' })),
        h('span.info', ` (${type} - ${humanSize})`),
      ]),
    ]),
  ])

const ResourceLexicon = ({ definitions }) =>
  h('.container.ResourceLexicon', [
    h(
      'dl',
      definitions.map(({ dt, dd }) =>
        h(Fragment, { key: dt }, [
          h('dt', dt),
          h('dd', [
            h('.gradient-expand', [
              h('.masked', dd),
              h('.read-more', [
                h('span', {}, h(T, { id: 'doc.read-full-definition' })),
              ]),
            ]),
          ]),
        ]),
      ),
    ),
  ])

const ResourceSource = ({ resource }) =>
  !resource.source
    ? null
    : h('.container.ResourceSource', [
        h(Html, { component: 'span.source-content' }, resource.source),
      ])

const Resource = injectIntl(({ resource, topics, options, intl }) => {
  let children
  switch (resource.type) {
    case 'definition':
      children = [
        h(ResourceLexicon, { definitions: resource.definitions }),
        h(ResourceDescription, { resource }),
      ]
      break
    case 'map':
      children = [
        h(ResourceMap, { resource, options }),
        h(ResourceSource, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceDescription, { resource }),
        h(ResourceImageDownload, { resource, options }),
        h(ArticleSeeAlso, {
          article: resource,
          topics,
          options,
          title: intl.formatMessage({ id: 'doc.related-article-or-focus' }),
        }),
      ]
      break
    case 'image':
      children = [
        h(ResourceImage, { resource, options }),
        h(ResourceSource, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceDescription, { resource }),
        h(ArticleSeeAlso, {
          article: resource,
          topics,
          options,
          title: intl.formatMessage({ id: 'doc.related-article-or-focus' }),
        }),
      ]
      break
    case 'sound':
      children = [
        h(ResourceSound, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceDescription, { resource }),
        h(ResourceTranscript, { resource }),
      ]
      break
    case 'video':
      children = [
        h(ResourceVideo, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceDescription, { resource }),
        h(ResourceTranscript, { resource }),
      ]
      break
    default:
      children = ['ResourcePage component not implemented']
  }
  return h('article.ResourcePage', [
    h('header.container.ResourceHeader', [
      h('.PageTitle', {}, h(T, { id: 'doc.resource-page-title' })),
      h('.ResourceType', {}, h(T, { id: `doc.type-plural.${resource.type}` })),
      h(Html, { component: 'h1.ResourceTitle' }, resource.title),
    ]),
    ...children,
  ])
})

const ResourcePage = injectIntl((
  {
    resource,
    topics,
    options,
    intl,
  } /*: {
  resource: Resource,
  topics: Topic[],
  resources: Resource[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: stripTags(resource.title), options }),
    h(Body, { topics, options, logoColor: 'black' }, [
      h(Resource, { resource, topics, options }),
    ]),
  ]),
)

module.exports = ResourcePage
