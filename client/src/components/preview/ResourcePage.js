// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { globalPageUrl } = require('./layout');

const Head = require('./Head')
const Body = require('./Body')
const Picture = require('./Picture')
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
      title: resource.title,
      src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
      frameBorder: 0,
      allowFullScreen: true,
    }),
  ])
}

const ResourceDescription = ({ resource }) => {
  return h('.container.ResourceDescription', [
    h('h2', 'Commentaire'),
    h('div', { dangerouslySetInnerHTML: { __html: resource.description_fr } }),
  ])
}

const ResourceCopyright = ({ resource }) =>
  h('.container.ResourceCopyright', {
    dangerouslySetInnerHTML: { __html: resource.copyright },
  })

const ResourceTranscript = ({ resource }) =>
  !resource.transcript
    ? null
    : h('.container.ResourceTranscript', [
        h('h2', 'Transcription'),
        h('div', { dangerouslySetInnerHTML: { __html: resource.transcript } }),
      ])

const ResourceImageDownload = ({ resource, options }) => {
  const large = resource.imageStats['large-3x'] || resource.imageStats['large-2x'] || resource.imageStats['large-1x']
  const medium = resource.imageStats['medium-3x'] || resource.imageStats['medium-2x'] || resource.imageStats['medium-1x']
  const small = resource.imageStats['small-3x'] || resource.imageStats['small-2x'] || resource.imageStats['small-1x']
  return h('.container.ResourceDownload', [
    h('h2', 'Téléchargement'),
    h('.warning', [
      'Pour toute utilisation, merci de consulter les ',
      h('a', { href: globalPageUrl('legals')(options.preview) }, 'mentions légales'),
      '.',
    ]),
    h('.download-blocks', [
      large ? ResourceImageDownloadBlock({ resource, title: 'version détaillée', stats: large }) : null,
      medium ? ResourceImageDownloadBlock({ resource, title: 'version simplifiée', stats: medium }) : null,
      small ? ResourceImageDownloadBlock({ resource, title: 'version très simplifiée', stats: small }) : null,
    ]),
  ])
}

const ResourceImageDownloadBlock = ({ resource, title, stats: { type, humanSize, width, height, url }}) =>
  h('.download-block', [
    h('img.download-preview', { src: url }),
    h('.download-info', [
      h('strong', title),
      h('a', { href: url, download: `${resource.id} - ${title}.${type}` }, [
        h('span.link', 'télécharger'),
        h('span.info', ` (${type} - ${humanSize})`),
      ])
    ]),
  ])

const ResourceLexicon = ({ definitions }) =>
  h('.container.ResourceLexicon', [
    h(
      'dl',
      definitions.map(({ dt, dd }) =>
        h(Fragment, [
          h('dt', dt),
          h('dd', [
            h('.gradient-expand', [
              h('.masked', dd),
              h('.read-more', [h('span', 'Lire la definition complète')]),
            ]),
          ]),
        ]),
      ),
    ),
  ])

const ResourceSource = ({ resource }) => {
  return h('.container.ResourceSource', [
    'Source : ',
    h('span.source-content', { dangerouslySetInnerHTML: { __html: resource.source } }),
  ])
}

const Resource = ({ resource, topics, options }) => {
  let children
  // TODO proper i18n for FO
  let displayedType = resource.type
  switch (resource.type) {
    case 'definition':
      displayedType = 'Définition'
      children = [
        h(ResourceLexicon, { definitions: resource.definitions }),
        h(ResourceDescription, { resource }),
      ]
      break
    case 'map':
      displayedType = 'Carte'
      children = [
        h(ResourceMap, { resource, options }),
        h(ResourceSource, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceImageDownload, { resource, options }),
        h(ArticleSeeAlso, { article: resource, topics, options, title: 'Article ou focus lié' }),
      ]
      break
    case 'image':
      displayedType = 'Image'
      children = [
        h(ResourceImage, { resource, options }),
        h(ResourceSource, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceImageDownload, { resource, options }),
        h(ArticleSeeAlso, { article: resource, topics, options, title: 'Article ou focus lié' }),
      ]
      break
    case 'sound':
      displayedType = 'Son'
      children = [
        h(ResourceSound, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceTranscript, { resource }),
      ]
      break
    case 'video':
      displayedType = 'Vidéo'
      children = [
        h(ResourceVideo, { resource, options }),
        h(ResourceCopyright, { resource, options }),
        h(ResourceTranscript, { resource }),
      ]
      break
    default:
      children = [
        'ResourcePage component not not implemented'
      ]
  }
  return h('article.ResourcePage', [
    h('header.container.ResourceHeader', [
      h('.PageTitle', 'Ressources'),
      h('.ResourceType', displayedType),
      h('h1.ResourceTitle', resource.title),
    ]),
    ...children,
  ])
}

const ResourcePage = ({
  resource,
  topics,
  options,
} /*: {
  resource: Resource,
  topics: Topic[],
  resources: Resource[],
  options: FrontOptions,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: resource.title, options }),
    h(Body, { topics, options, logoColor: 'black' }, [h(Resource, { resource, topics, options })]),
  ])

module.exports = ResourcePage
