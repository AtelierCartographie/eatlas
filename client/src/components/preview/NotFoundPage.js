// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { prefixUrl, globalPageUrl } = require('./layout')
const Head = require('./Head')
const Body = require('./Body')

const Content = ({ options }) => {
  return h('article.container.NotFoundPage', [
    h('h1', 'Page non trouvée'),
    h('p', 'La page que vous avez demandéz n’existe pas, ou n’existe plus.'),
    h('p', [
      'Vous pouvez signaler le lien brisé via ',
      h(
        'a',
        { href: globalPageUrl('about', null, 'contact')(options) },
        'notre formulaire de contact',
      ),
      '.',
    ]),
    h('p.back-home', [
      h(
        'a.button.btn',
        {
          href: options.preview
            ? `${options.apiUrl || ''}/preview`
            : prefixUrl('/'),
          role: 'link',
        },
        'Retour à la page d’accueil',
      ),
    ]),
  ])
}

const NotFoundPage = (
  { topics, options } /*: {
  topics: Topic[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'Page introuvable', options }),
    h(Body, { topics, options, logoColor: 'black' }, [h(Content, { options })]),
  ])

module.exports = NotFoundPage
