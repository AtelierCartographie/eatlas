// @flow

const h = require('react-hyperscript')
const { Img } = require('./Tags')
const { resourcesTypes, aPropos } = require('./layout')

const TopMenuPanelMain = () => {
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
            resourcesTypes.map(rt => h('li', [h('a', { href: 'TODO' }, rt)])),
          ),
        ]),
        h('.col-sm-6', [
          h('h2', 'À propos'),
          h('ol', aPropos.map(rt => h('li', [h('a', { href: 'TODO' }, rt)]))),
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
      h('.row', [
        h('.col-sm-6 .col-first', [
          h('ol', [
            h('li', [
              h('a', { href: 'TODO' }, '1. Organisations internationales'),
            ]),
            h('li', [
              h('a', { href: 'TODO' }, '2. Les États et le transnational'),
            ]),
            h('li', [
              h('a', { href: 'TODO' }, "3. Miettes d'Empires/États manqués"),
            ]),
            h('li', [h('a', { href: 'TODO' }, '4. Pays émergents')]),
            h('li', [h('a', { href: 'TODO' }, "5. L'Europe acteur global")]),
            h('li', [h('a', { href: 'TODO' }, '6. Intégrer la diversité ?')]),
            h('li', [
              h(
                'a',
                { href: 'TODO' },
                '7. Entrepreneurs identitaires et religieux',
              ),
            ]),
          ]),
        ]),
        h('.col-sm-6', [
          h('ol', [
            h('li', [h('a', { href: 'TODO' }, '8. Société civile')]),
            h('li', [h('a', { href: 'TODO' }, '9. ONG plurielle')]),
            h('li', [h('a', { href: 'TODO' }, '10. Géants du web et medias')]),
            h('li', [h('a', { href: 'TODO' }, '11. Firmes globales')]),
            h('li', [h('a', { href: 'TODO' }, '12. Finance en crises')]),
            h('li', [
              h('a', { href: 'TODO' }, '13. Criminalités transnationales'),
            ]),
          ]),
        ]),
      ]),
    ]),
  ])
}

exports.TopMenu = ({ topic, topics, options }) => {
  // used to add the bottom white border indicator (active)
  const currentTopic = topic
  return h('nav.container.TopMenu', { role: 'navigation' }, [
    h('ul', [
      h(TopMenuPanelMain),
      topics.map(topic =>
        h(TopMenuPanelTopic, { topic, active: currentTopic.id === topic.id }),
      ),
    ]),
  ])
}
