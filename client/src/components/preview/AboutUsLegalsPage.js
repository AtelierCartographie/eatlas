// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const Content = () => {
  return h('article.container.AboutUsLegalsPage', [
    h('h1', 'Mentions légales'),

    h('h2', 'Le contenu de ce site internet est fourni par'),
    h('p', [
      'Sciences Po',
      h('br'),
      '27 rue Saint-Guillaume',
      h('br'),
      '75337 Paris Cedex 07',
      h('br'),
      'Tel. : 01 45 49 50 50',
      h('br'),
      'Fax. : 01 42 22 31 26',
      h('br'),
      'webmestre@sciencespo.fr',
    ]),

    h('h2', 'Directeur de la publication'),
    h('p', 'Frédéric Mion, President of Sciences Po'),

    h('h2', 'Hébergement'),
    h('p', [
      `Ce site internet est hébergé par la Fondation Nationale des Sciences Politiques (FNSP)`,
      h('br'),
      `Sciences Po - Direction des Systèmes d'Information`,
      h('br'),
      `APE Code: 803Z`,
      h('br'),
      `27, rue saint Guillaume`,
      h('br'),
      `75337 Paris cedex 07`,
    ]),

    h('h2', 'Propriété Industrielle et Intellectuelle'),
    h(
      'p',
      `Toutes les informations reproduites dans ce site web (textes, photos, logos...) sont protégées par des droits de propriété intellectuelle détenus par Sciences Po ou par ses partenaires.
Par conséquent, aucune de ces informations ne peut être reproduite, modifiée, rediffusée, traduite, exploitée commercialement ou réutilisée de quelque manière que ce soit sans l'accord préalable et écrit de Sciences Po.`,
    ),
    h(
      'p',
      `Le titre, la conception, la forme du site Sciences Po mais aussi son contenu tels que les actualités, descriptions, illustrations et images originales et leur organisation, ainsi que toute compilation de logiciels, code source fondamental et autres éléments contenus sur le site Sciences Po sont la propriété de Sciences Po.`,
    ),

    h('h2', 'Les liens hypertextes'),
    h(
      'p',
      `Nos pages web proposent également des liens vers d'autres sites pour lesquels nous ne sommes responsables ni de leur intégral respect aux normes d'ordre public et bonnes mœurs, d'une part, ni de leur politique de protection des données personnelles ou d'utilisation qui en seraient faites, d'autre part.`,
    ),
    h(
      'p',
      `En accédant à un autre site, par l'intermédiaire d'un lien hypertexte, vous acceptez que cet accès s'effectue à vos risques et périls. En conséquence, tout préjudice direct ou indirect résultant de votre accès à un autre site relié par un lien hypertexte ne peut engager la responsabilité de Sciences Po.`,
    ),
  ])
}

const AboutUsLegalsPage = ({
  topics,
  articles,
  options,
} /*: {
  topics: Topic[],
  articles: Resource[],
  options: Object,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'Mentions légales', options }),
    h(Body, { topics, options, topMenu: true, logoColor: 'black' }, [
      h(Content, { topics, articles, options }),
    ]),
  ])

module.exports = AboutUsLegalsPage
