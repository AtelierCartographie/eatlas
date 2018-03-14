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
  return h('.container.ResourceDescription', [h('h2', 'Commentaire'), h('div', resource.description)])
}

const Resource = ({ resource }) => {
  let children
  switch (resource.type) {
    case 'video':
      children = h(ResourceVideo, { resource })
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
  ])
}

class ResourcePage extends Component /*::<{resource: Resource, topics: Topic[] }>*/ {
  render() {
    const { resource, topics, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: resource.title }),
      h(Body, { topics, options }, [
        h(Resource, { resource, topics, options }),
      ]),
    ])
  }
}

module.exports = ResourcePage
