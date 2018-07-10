// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')

const TeamMember = ({ member }) => {
  return h('li.TeamMember', [
    h('.avatar'),
    [
      h('div', [
        h('.TeamMemberName', member[0]),
        h('.TeamMemberName', member[1]),
      ]),
    ],
  ])
}

const Team = () => {
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

  return h('section.AboutTeam', [
    h('.container', [
      h('h2', "L'équipe"),
      h('h3', 'Les textes'),
      h('ul', authors.map(member => h(TeamMember, { member }))),
      h('h3', 'Les visualisations (Sciences Po - Atelier de cartographie)'),
      h('ul', cartographers.map(member => h(TeamMember, { member }))),
    ]),
  ])
}

const About = ({ topics, options }) => {
  return h('article.AboutPage', [
    h('header.AboutHeader', [
      h('.container', [h('h1.AboutTitle', 'À propos')]),
    ]),
    h('section.AboutProject', [
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
    h(Team),
    h('section.AboutBook', [
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
  ])
}

const AboutPage = ({
  topics,
  articles,
  options,
} /*: {
  topics: Topic[],
  articles: Resource[],
  options: Object,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'À propos', options }),
    h(Body, { topics, options, topMenu: true, logoColor: 'white' }, [
      h(About, { topics, articles, options }),
    ]),
  ])

module.exports = AboutPage
