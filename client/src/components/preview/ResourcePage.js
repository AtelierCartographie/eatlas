// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const apiBaseUrl = process.env.REACT_APP_API_SERVER || ''

const ResourceMap = ({ resource }) => {
  return h('.ResourceMap', [
    h('img', { src: `${apiBaseUrl}/resources/${resource.id}/file` }),
  ])
}

const ResourceImage = ({ resource }) => {
  return h('.ResourceImage', [
    h('img', { src: `${apiBaseUrl}/resources/${resource.id}/file` }),
  ])
}

const ResourceSound = ({ resource }) => {
  if (!resource.mediaUrl) return null
  return h('.container.ResourceSound', [
    h('audio', { src: resource.mediaUrl, controls: true }),
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
    h('div', resource.description),
  ])
}

const ResourceCopyright = ({ resource }) =>
  h('.container.ResourceCopyright', `Source: ${resource.copyright}`)

const ResourceTranscript = ({ resource }) =>
  h('.container.ResourceTranscript', [h('h2', 'Transcript'), h('div', 'TODO')])

const ResourceDownload = ({ resource }) =>
  h('.container.ResourceDownload', [
    h('h2', 'Téléchargement'),
    h(
      'div',
      'Pour toute utilisation, merci de consulter les mentions légales.',
    ),
  ])

const Resource = ({ resource }) => {
  let children
  switch (resource.type) {
    case 'map':
      children = [
        h(ResourceMap, { resource }),
        h(ResourceCopyright, { resource }),
      ]
      break
    case 'image':
      children = [
        h(ResourceImage, { resource }),
        h(ResourceCopyright, { resource }),
      ]
      break
    case 'sound':
      children = [
        h(ResourceSound, { resource }),
        h(ResourceCopyright, { resource }),
      ]
      break
    case 'video':
      children = [
        h(ResourceVideo, { resource }),
        h(ResourceCopyright, { resource }),
      ]
      break

    default:
      children = 'ResourcePage component not not implemented'
  }
  return h('article.ResourcePage', [
    h('header.container.ResourceHeader', [
      h('.PageTitle', 'Ressources'),
      h('.ResourceType', resource.type),
      h('h1.ResourceTitle', resource.title),
    ]),
    children,
    h(ResourceDescription, { resource }),
    ['sound', 'video'].includes(resource.type) &&
      h(ResourceTranscript, { resource }),
    resource.type === 'map' && h(ResourceDownload, { resource }),
  ])
}

class ResourcePage extends Component /*::<{resource: Resource, topics: Topic[] }>*/ {
  render() {
    const { resource, topics, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: resource.title, options }),
      h(Body, { topics, options }, [
        h(Resource, { resource, topics, options }),
      ]),
    ])
  }
}

module.exports = ResourcePage
