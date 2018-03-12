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
            [h(Img, { alt: t.name, src: `/topics/${t.id}.svg` }), t.name],
          ),
        ]),
      ),
    ),
  ])
}

module.exports = ({ topics, options }) =>
  h('div.table-content-bg', [
    h('footer.footer-page', [
      h('div.container', [
        h('div.row', [
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'Sommaire'),
            h(Topics, { topics, options }),
          ]),
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'Resources'),
            h('nav', [
              h(
                'ul',
                resourcesTypes.map((r, i) => h('li', { key: i }, [h('a', r)])),
              ),
            ]),
          ]),
          h('section.col-xs-6.col-sm-4', [
            h('h3', 'À propos'),
            h('nav', [
              h('ul', aPropos.map((a, i) => h('li', { key: i }, [h('a', a)]))),
            ]),
          ]),
        ]),
        h('section.row.footer-logo', [
          h('div.col-xs-6.col-sm-4', [
            h('a', [
              h(Img, {
                className: 'img-responsive',
                alt: 'Sciences Po - Atelier de cartographie',
                src: '/assets/img/logo-Atelier-NB.svg',
              }),
            ]),
          ]),
          h('div.col-xs-6.col-sm-4'),
          h('div.col-xs-6.col-sm-4', [
            h('a', [
              h(Img, {
                className: 'img-responsive',
                alt: 'Sciences Po - Bibliothèque',
                src: '/assets/img/logo-Bibli-NB.svg',
              }),
            ]),
          ]),
        ]),
      ]),
    ]),
  ])
