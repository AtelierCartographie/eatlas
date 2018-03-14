// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component, Fragment } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { PublishedAt } = require('./Doc')
const { Script, Img } = require('./Tags')
const Head = require('./Head')
const Body = require('./Body')
const {
  HOST,
  resourcesTypes,
  aPropos,
  getImageUrl,
  getResource,
} = require('./layout')

// subcomponents

const FocusHeader = ({ focus }) =>
  h('header.FocusHeader', [
    h('.container.FocusHeaderInfo', [
      h('.FocusIcon', 'Focus'),
      h('h1.FocusTitle', focus.title),
      h(PublishedAt, { doc: focus }),
    ]),
  ])

const FocusNodes = props => null

const Focus = props =>
  h('article.focus.FocusPage', [h(FocusHeader, props), h(FocusNodes, props)])

class FocusPage extends Component /*::<{focus: Resource, topics: Topic[], definitions: Definition[], resources: Resource[]}>*/ {
  render() {
    const { focus, topics, definitions, resources, options } = this.props
    console.log({ focus })
    return h('html', { lang: 'fr' }, [
      h(Head, { title: focus.title }),
      h(Body, { topics, options }, [
        h(Focus, { focus, topics, definitions, resources, options }),
      ]),
    ])
  }
}

module.exports = FocusPage
