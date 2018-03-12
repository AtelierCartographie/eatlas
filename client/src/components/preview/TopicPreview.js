// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component, Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = ({ article }) => {
  const title = article.metas.find(m => m.type === 'title')
  return h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', `${title.text} - eAtlas`),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css',
    }),
    h(StyleSheet, { href: '/assets/css/main-v3.css' }),
    h(StyleSheet, { href: '/assets/css/nav.css' }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,700,700i',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Gentium+Basic:400,400i,700,700i',
    }),
  ])
}

class TopicPreview extends Component {
  render() {
    const { topic } = this.props
    return h('html', { lang: 'fr' }, [])
  }
}

module.exports = TopicPreview
