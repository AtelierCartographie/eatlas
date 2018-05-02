// @flow

const h = require('react-hyperscript')
const {
  resourcesTypes,
  aPropos,
  getResourcePageUrl,
  getTopicPageUrl,
  prefixUrl,
} = require('./layout')

const TopMenuPanelSearch = ({ options: { preview } }) => {
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
      [
        h('img', {
          alt: 'rechercher',
          src: prefixUrl(`/assets/img/search.svg`, preview),
        }),
      ],
    ),
    h('.TopMenuPanel.dropdown-menu', { id }, [
      h('input', {
        placeholder: 'Rechercher',
        title: 'rechercher',
        // TODO
        'data-search-page-url': preview ? '/preview/search' : '',
      }),
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

const TopMenuPanelTopic = ({ topic, articles, active, options }) => {
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
      topic.id,
    ),
    h('.TopMenuPanel.dropdown-menu', { id }, [
      h('h2', [
        h(
          'a',
          { href: getTopicPageUrl(topic, options) },
          `${topic.id}. ${topic.name}`,
        ),
      ]),
      h('ol', [
        (articles || [])
          .filter(a => a.topic === topic.id)
          .map(a =>
            h('li', { key: a.id }, [
              h('a', { href: getResourcePageUrl(a, options) }, a.title),
            ]),
          ),
      ]),
    ]),
  ])
}

exports.TopMenu = (
  {
    topic,
    topics,
    articles,
    options,
  } /*: { topic: Topic, topics: Topic[], articles: Resource[], options: Object } */,
) => {
  // used to add the bottom white border indicator (active)
  const currentTopic = topic || {}
  return h('.container.TopMenu', [
    h('.TopMenuSearch', { role: 'search' }, [
      h(TopMenuPanelSearch, { options }),
    ]),
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
