// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { prefixUrl, getSearchUrl } = require('./layout')
const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const HomeTeamMember = ({ member }) => {
  return h('li.HomeTeamMember', [
    h('.avatar'),
    [h('div', [h('.HomeTeamMemberName', member[0]), h('.HomeTeamMemberName', member[1])])],
  ])
}

const HomeTeam = () => {
  const authors = [
    ['Delphine', 'Allès'],
    ['Mélanie', 'Albaret'],
    ['Philippe', 'Copinschi'],
    ['Marie Françoise', 'Durand'],
    ['Lucile', 'Maertens'],
    ['Delphine', 'Placidi-Frot'],
  ]

  const cartographers = [
    ['Thomas', 'Ansart'],
    ['Benoît', 'Martin'],
    ['Patrice', 'Mitrano'],
    ['Anouk', 'Pettes'],
    ['Antoine', 'Rio'],
  ]

  return h('section.HomeTeam', [
    h('.container', [
      h('h2', "L'équipe"),
      h('h3', 'Six auteurs'),
      h('ul', authors.map(member => h(HomeTeamMember, { member }))),
      h('h3', 'Cinq cartographes (Sciences Po - Atelier de cartographie)'),
      h('ul', cartographers.map(member => h(HomeTeamMember, { member }))),
    ]),
  ])
}

const Home = ({ topics, options }) => {
  return h('article.HomePage', [
    h('header.container.HomeHeader', [
      h('h1.HomeTitle', 'Un atlas pour comprendre'),
      h('h1.HomeTitle.HomeTitleTyped', "l'espace mondial contemporain"),
      h('div', [
        h('button', 'Commencer la lecture'),
        h('button.tour', 'Visite guidée'),
      ]),
      h('div', [
        h('input', {
          placeholder: "Rechercher dans l'atlas",
          'data-search-page-url': getSearchUrl({}, options),
        }),
        h('button', [
          h('img', {
            alt: '',
            src: prefixUrl('/assets/img/search.svg', options.preview),
          }),
        ]),
      ]),
    ]),
    h('section.HomeNav', [
      h('.container', [
        h('.row', [
          h('.col-sm-4', [
            'Un ouvrage numérique accessible librement fruit d’une collaboration de six auteurs.',

            h('button', 'Accéder au sommaire'),
          ]),
          h('.col-sm-4', [
            'Des ressources originales nombreuses (cartes, graphiques, photos, définitions)',
            h('button', 'Voir les ressources'),
          ]),
          h('.col-sm-4', 'Un projet mené par trois équipes de Sciences Po.'),
        ]),
      ]),
    ]),
    h('section.HomeBook', [
      h('.container', [
        h('.row', [
          h('.col-sm-4', [
            'Espace Mondial : l’Atlas est aussi un beau livre papier publié aux Presses de Sciences Po.',
            h('button', 'Acheter le livre'),
          ]),
          h('.col-sm-8', ''),
        ]),
      ]),
    ]),
    h('section.HomeTopics', [
      h('.container', [
        h('h2', 'Sommaire'),
        h('.row', [
          h('.col-sm-4', [
            h('.TopicNumber'),
            h('div', topics[0].name),
          ]),
        ]),
        h(
          '.row',
          topics
            .slice(1)
            .map(t =>
              h('.col-sm-4', [h('.TopicNumber', t.id), h('div', t.name)]),
            ),
        ),
      ]),
    ]),
    h('section.HomeProject', [
      h('.container', [
        h('h2', 'Le projet'),
        h('.row', [
          h(
            '.col-sm-6',
            'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
          ),
          h(
            '.col-sm-6',
            'nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
          ),
        ]),
      ]),
    ]),
    h(HomeTeam),
  ])
}

const HomePage = (
  {
    topics,
    articles,
    options,
  } /*:{topics: Topic[], articles: Resource[], options: Object }*/,
) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'eAtlas', options }),
    h(Body, { topics, articles, options, topMenu: true, logoColor: 'white' }, [
      h(Home, { topics, options }),
    ]),
  ])

module.exports = HomePage
