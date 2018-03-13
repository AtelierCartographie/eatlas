// @flow
const h = require('react-hyperscript')
const { Img } = require('./Tags')
const { resourcesTypes, aPropos } = require('./layout')

const Topics = ({ topics, options }) => {
  return h('nav', [
    h(
      'ul',
      topics.map(t =>
        h('li', { key: t.id }, [
          h(
            'a',
            { href: options.preview ? `/topics/${t.id}/preview` : 'TODO' },
            `${t.id - 1}. ${t.name}`,
          ),
        ]),
      ),
    ),
  ])
}

module.exports = ({ topics, options }) =>
  h('footer.container.footer-page.Footer', [
    h('div.row', [
      h('section.col-xs-6.col-sm-3', [
        h('a', [
          h(Img, {
            className: 'img-responsive',
            alt: 'Sciences Po - Atelier de cartographie',
            src: '/assets/img/logo-Atelier-NB.svg',
          }),
        ]),
      ]),
      h('section.col-xs-6.col-sm-3', [
        h('h2', 'Sommaire'),
        h(Topics, { topics, options }),
      ]),
      h('section.col-xs-6.col-sm-3', [
        h('h2', 'Resources'),
        h('ul', resourcesTypes.map((r, i) => h('li', { key: i }, [h('a', r)]))),
      ]),
      h('section.col-xs-6.col-sm-3', [
        h('h2', 'À propos'),
        h('ul', aPropos.map((a, i) => h('li', { key: i }, [h('a', a)]))),
      ]),
    ]),
  ])
