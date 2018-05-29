// @flow
const h = require('react-hyperscript')
const {
  resourcesTypes,
  aPropos,
  getTopicPageUrl,
  prefixUrl,
} = require('./layout')

const Topics = ({ topics, options }) =>
  h('nav', [
    h(
      'ul',
      topics.map(t =>
        h('li', { key: t.id }, [
          h(
            'a',
            {
              href: getTopicPageUrl(t, options),
            },
            `${t.id}. ${t.name}`,
          ),
        ]),
      ),
    ),
  ])

const FooterLogo = ({ options }) =>
  h('a', [
    h('img', {
      alt: 'Sciences Po',
      src: prefixUrl('/assets/img/sciences-po.svg', options.preview),
    }),
  ])

module.exports = (
  { topics, options } /*: { topics: Topic[], options: Object } */,
) =>
  h('footer.container.Footer', { role: 'contentinfo' }, [
    h('.FooterRow', [
      h('.FooterColTopics', [
        h('h2', 'Sommaire'),
        h(Topics, { topics, options }),
      ]),
      h('.FooterColResources', [
        h('h2', 'Resources'),
        h(
          'ul',
          resourcesTypes.map((r, i) =>
            h('li', { key: i }, [
              h('a', { href: r.url(options.preview) }, r.text),
            ]),
          ),
        ),
      ]),
      h('.FooterColAPropos', [
        h('h2', 'À propos'),
        h(
          'ul',
          aPropos.map((a, i) =>
            h('li', { key: i }, [
              h('a', { href: a.url(options.preview) }, a.text),
            ]),
          ),
        ),
      ]),
      h('.FooterColLogo', [h(FooterLogo, { options })]),
    ]),
  ])
