// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const Content = ({ topics, articles, options }) => {
  return h('article.MissingPage', [
    h('h1', 'Page lost'),
    h('p', 'HTML generator not implemented yet?'),
  ])
}

class MissingPage extends Component {
  render() {
    const { topics, articles, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: 'Missing page' }),
      h(Body, { topics, options, topMenu: true }, [
        h(Content, { topics, articles, options }),
      ]),
    ])
  }
}

module.exports = MissingPage
