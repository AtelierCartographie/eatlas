// @flow

const h = require('react-hyperscript')
const { resourcesTypes, aPropos } = require('./layout')
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
            'ol',
            resourcesTypes.map(rt =>
              h('li', [h('a', { href: rt.url(options.preview) }, rt.text)]),
            ),
          ),
        ]),
        h('.col-sm-6', [
          h('h2', 'À propos'),
          h(
            'ol',
            aPropos.map(rt =>
              h('li', [h('a', { href: rt.url(options.preview) }, rt.text)]),
            ),
          ),
        ]),
      ]),
    ]),
  ])
}

const TopMenuPanelTopic = ({ topic, active }) => {
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
      h('h2', `${topic.id - 1}. ${topic.name}`),
      h('ol', [
        h('li', [h('a', { href: 'TODO' }, 'Organisations internationales')]),
        h('li', [h('a', { href: 'TODO' }, 'Les États et le transnational')]),
        h('li', [h('a', { href: 'TODO' }, "Miettes d'Empires/États manqués")]),
        h('li', [h('a', { href: 'TODO' }, 'Pays émergents')]),
        h('li', [h('a', { href: 'TODO' }, "L'Europe acteur global")]),
        h('li', [h('a', { href: 'TODO' }, 'Intégrer la diversité ?')]),
        h('li', [
          h('a', { href: 'TODO' }, 'Entrepreneurs identitaires et religieux'),
        ]),
        h('li', [h('a', { href: 'TODO' }, 'Société civile')]),
        h('li', [h('a', { href: 'TODO' }, 'ONG plurielle')]),
        h('li', [h('a', { href: 'TODO' }, 'Géants du web et medias')]),
        h('li', [h('a', { href: 'TODO' }, 'Firmes globales')]),
        h('li', [h('a', { href: 'TODO' }, 'Finance en crises')]),
        h('li', [h('a', { href: 'TODO' }, 'Criminalités transnationales')]),
      ]),
    ]),
  ])
}

exports.TopMenu = ({ topic, topics, options }) => {
  // used to add the bottom white border indicator (active)
  const currentTopic = topic || {}
  return h('.container.TopMenu', [
    h('.TopMenuSearch', { role: 'search' }, [h(TopMenuPanelSearch)]),
    h('nav', { role: 'navigation' }, [
      h('ul', [
        h(TopMenuPanelMain, { options }),
        topics.map(topic =>
          h(TopMenuPanelTopic, { topic, active: currentTopic.id === topic.id }),
        ),
      ]),
    ]),
  ])
}
