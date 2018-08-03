// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')
const Picture = require('./Picture')

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
      title: 'TODO',
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

const ResourceDownload = ({ resource }) =>
  h('.container.ResourceDownload', [
    h('h2', 'Téléchargement'),
    h(
      'div',
      'Pour toute utilisation, merci de consulter les mentions légales.',
    ),
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

const Resource = ({ resource, options }) => {
  let children
  // TODO proper i18n for FO
  let displayedType = resource.type
  switch (resource.type) {
    case 'definition':
      displayedType = 'Définition'
      children = [h(ResourceLexicon, { definitions: resource.definitions })]
      break
    case 'map':
      displayedType = 'Carte'
      children = [
        h(ResourceMap, { resource, options }),
        h(ResourceCopyright, { resource, options }),
      ]
      break
    case 'image':
      displayedType = 'Image'
      children = [
        h(ResourceImage, { resource, options }),
        h(ResourceCopyright, { resource, options }),
      ]
      break
    case 'sound':
      displayedType = 'Son'
      children = [
        h(ResourceSound, { resource, options }),
        h(ResourceCopyright, { resource, options }),
      ]
      break
    case 'video':
      displayedType = 'Vidéo'
      children = [
        h(ResourceVideo, { resource, options }),
        h(ResourceCopyright, { resource, options }),
      ]
      break

    default:
      children = 'ResourcePage component not not implemented'
  }
  return h('article.ResourcePage', [
    h('header.container.ResourceHeader', [
      h('.PageTitle', 'Ressources'),
      h('.ResourceType', displayedType),
      h('h1.ResourceTitle', resource.title),
    ]),
    children,
    resource.type !== 'definition' && h(ResourceDescription, { resource }),
    ['sound', 'video'].includes(resource.type) &&
      h(ResourceTranscript, { resource }),
    resource.type === 'map' && h(ResourceDownload, { resource }),
  ])
}

const ResourcePage = ({
  resource,
  topics,
  options,
} /*: {
  resource: Resource,
  topics: Topic[],
  options: FrontOptions,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: resource.title, options }),
    h(Body, { topics, options, logoColor: 'black' }, [h(Resource, { resource, topics, options })]),
  ])

module.exports = ResourcePage
