// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { PublishedAt, Paragraph, Lexicon } = require('./Doc')
const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const FocusHeader = ({ focus }) =>
  h('header.FocusHeader', [
    h('.container.FocusHeaderInfo', [
      h('.FocusIcon', 'Focus'),
      h('h1.FocusTitle', focus.title),
      h(PublishedAt, { doc: focus }),
    ]),
  ])

const FocusNodes = ({ focus, resources, lexiconId }) => {
  return focus.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container', { key: n.id }, n.text)
      case 'p':
        return h(Paragraph, { p: n, key: n.id, lexiconId })
      default:
        return null
    }
  })
}

const Focus = props =>
  h('article.focus.FocusPage', [
    h(FocusHeader, props),
    h(FocusNodes, props),
    h(Lexicon, { nodes: props.focus.nodes, definitions: props.definitions }),
  ])

class FocusPage extends Component /*::<{focus: Resource, topics: Topic[], definitions: Definition[], resources: Resource[]}>*/ {
  render() {
    const { focus, topics, definitions, resources, options } = this.props
    const lexiconId = {
      id: 0,
    }
    return h('html', { lang: 'fr' }, [
      h(Head, { title: focus.title }),
      h(Body, { topics, options }, [
        h(Focus, { focus, topics, definitions, resources, lexiconId, options }),
      ]),
    ])
  }
}

module.exports = FocusPage
