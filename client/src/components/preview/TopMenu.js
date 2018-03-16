// @flow

const h = require('react-hyperscript')
const {
  resourcesTypes,
  aPropos,
  getResourcePageUrl,
  getTopicPageUrl,
} = require('./layout')
const { Img } = require('./Tags')

const TopMenuPanelSearch = () => {
  const id = 'TopMenuPanel-search'
  return [
    h(
      'button.dropdown-toggle',
      {
        type: 'button',
        'data-toggle': 'dropdown',
        'aria-controls': id,
        'aria-expanded': false,
        'aria-haspopup': true,
      },
      [h(Img, { alt: 'rechercher', src: `/assets/img/search.svg` })],
    ),
    h('.TopMenuPanel.dropdown-menu', { id }, [
      h('input', { placeholder: 'Rechercher', title: 'rechercher' }),
    ]),
  ]
}

const TopMenuPanelMain = ({ options }) => {
  const id = 'TopMenuPanel-main'
  return h('li.TopicMenuPanel', [
    h(
      'button.dropdown-toggle',
      {
        type: 'button',
        'data-toggle': 'dropdown',
        'aria-controls': id,
        'aria-expanded': false,
        'aria-haspopup': true,
      },
      'Menu',
    ),
    h('.TopMenuPanel.dropdown-menu', { id }, [
      h('.row', [
        h('.col-sm-6 .col-first', [
          h('h2', 'Ressources'),
          h(
            'ul',
            resourcesTypes.map(rt =>
              h('li', [h('a', { href: rt.url(options.preview) }, rt.text)]),
            ),
          ),
        ]),
        h('.col-sm-6', [
          h('h2', 'À propos'),
          h(
            'ul',
            aPropos.map(rt =>
              h('li', [h('a', { href: rt.url(options.preview) }, rt.text)]),
            ),
          ),
        ]),
      ]),
    ]),
  ])
}

const TopMenuPanelTopic = ({ topic, topics, articles, active, options }) => {
  const id = `TopMenuPanel-${topic.id}`

  return h('li.TopicMenuPanel', [
    h(
      'button.dropdown-toggle',
      {
        className: active ? 'active' : '',
        type: 'button',
        'data-toggle': 'dropdown',
        'aria-controls': id,
        'aria-expanded': false,
        'aria-haspopup': true,
      },
      topic.id - 1,
    ),
    h('.TopMenuPanel.dropdown-menu', { id }, [
      h('h2', [
        h(
          'a',
          { href: getTopicPageUrl(topic, options) },
          `${topic.id - 1}. ${topic.name}`,
        ),
      ]),
      h('ol', [
        (articles || [])
          .filter(a => a.topic === topic.id)
          .map(a =>
            h('li', { key: a.id }, [
              h('a', { href: getResourcePageUrl(a, topics, options) }, a.title),
            ]),
          ),
      ]),
    ]),
  ])
}

exports.TopMenu = ({ topic, topics, articles, options }) => {
  // used to add the bottom white border indicator (active)
  const currentTopic = topic || {}
  return h('.container.TopMenu', [
    h('.TopMenuSearch', { role: 'search' }, [h(TopMenuPanelSearch)]),
    h('nav', { role: 'navigation' }, [
      h('ul', [
        h(TopMenuPanelMain, { options }),
        topics.map(topic =>
          h(TopMenuPanelTopic, {
            key: topic.id,
            topic,
            topics,
            articles,
            active: currentTopic.id === topic.id,
            options,
          }),
        ),
      ]),
    ]),
  ])
}
