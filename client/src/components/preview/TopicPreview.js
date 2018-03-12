// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component, Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')

class TopicPreview extends Component {
  render() {
    const { topic } = this.props
    return h('html', { lang: 'fr' }, [h(Head, { title: topic.name })])
  }
}

module.exports = TopicPreview
