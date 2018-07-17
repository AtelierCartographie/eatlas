// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Head = require('./Head')
const Body = require('./Body')
const { prefixUrl } = require('./layout')

// AllÈs
const toId = lastname => lastname.toLowerCase().replace('è', 'e')

const TeamMemberModal = ({ member }) => {
  return h(
    `#${toId(member.lastname)}.modal.fade`,
    { tabIndex: -1, role: 'dialog', 'aria-labelledby': 'modal' },
    [
      h('.modal-dialog.modal-lg', { role: 'document' }, [
        h('.modal-content', {}, [
          h('.modal-body', [
            h('.row', [
              h('.col-md-4', h('img', { alt: `${member.firstname} ${member.lastname}`})),
              h('.col-md-8', [
                h('h2', `${member.firstname} ${member.lastname}`),
                h('h3', member.title),
                h('p', member.bio),
                h('div.TeamMemberLinks', [
                  Boolean(member.page) &&
                    h('a', { href: member.page}, member.page),
                  Boolean(member.social) &&
                    h('a', { href: member.social}, member.social),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ],
  )
}

const TeamMember = ({ member }) => {
  return h('li.col-md-2.TeamMember', [
    h(
      'button',
      {
        'data-toggle': 'modal',
        'data-target': `#${toId(member.lastname)}`,
      },
      [
        h('.avatar'),
        [
          h('div', [
            h('.TeamMemberName', member.firstname),
            h('.TeamMemberName', member.lastname),
          ]),
        ],
      ],
    ),
  ])
}

const Team = () => {
  const authors = [
    {
      firstname: 'Delphine',
      lastname: 'Allès',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Mélanie',
      lastname: 'Albaret',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Philippe',
      lastname: 'Copinschi',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Marie Françoise',
      lastname: 'Durand',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Lucile',
      lastname: 'Maertens',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Delphine',
      lastname: 'Placidi-Frot',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
  ]

  const cartographers = [
    {
      firstname: 'Thomas',
      lastname: 'Ansart',
      title: 'TITLE',
      bio: 'BIO',
      page: 'page',
      social: 'social',
    },
    {
      firstname: 'Benoît',
      lastname: 'Martin',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Patrice',
      lastname: 'Mitrano',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Anouk',
      lastname: 'Pettes',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
    {
      firstname: 'Antoine',
      lastname: 'Rio',
      title: 'TITLE',
      bio: 'BIO',
      page: '',
      social: '',
    },
  ]

  return h('section.AboutTeam#team', [
    h('.container', [
      h('h2', "L'équipe"),
      h('h3', 'Les textes'),
      h('ul', authors.map(member => h(TeamMember, { member }))),
      h('h3', 'Les visualisations (Sciences Po - Atelier de cartographie)'),
      h('ul', cartographers.map(member => h(TeamMember, { member }))),
      authors.map(member => h(TeamMemberModal, { member })),
      cartographers.map(member => h(TeamMemberModal, { member })),
    ]),
  ])
}

const About = ({ options }) => {
  return h('article.AboutPage', [
    h('header.AboutHeader', [
      h('.container', [h('h1.AboutTitle', 'À propos')]),
    ]),
    h('section.AboutProject#project', [
      h('.container', [
        h('h2', 'Le projet'),
        h('h3', 'La génèse'),
        h('.row', [
          h(
            'p.col-sm-8',
            'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
          ),
          h('a.col-sm-4.logo', [
            h('img', {
              alt: 'Sciences Po',
              src: prefixUrl('/assets/img/sciences-po.svg', options.preview),
            }),
          ]),
        ]),
        h('h3', 'Paragraphe 2'),
        h(
          'p',
          'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
        ),
        h('h3', 'Paragraphe 3'),
        h(
          'p',
          'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
        ),
      ]),
    ]),
    h(Team),
    h('section.AboutContact#contact', [
      h('.container', [
        h('h2', 'Nous contacter'),
        h('.row', [
          h('.col-sm-8', [
            'Rentrer en contact avec les rédacteurs et les cartographes',
          ]),
          h('.col-sm-4', [h('button', 'Nous contacter')]),
        ]),
      ]),
    ]),
    h('section.AboutBook#book', [
      h('.container', [
        h('h2', 'Le livre'),
        h('.row', [
          h('.col-sm-8', [
            'Espace Mondial : l’Atlas est aussi un beau livre papier publié aux Presses de Sciences Po.',
          ]),
          h('.col-sm-4', [h('button', 'Acheter le livre')]),
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
    h(Body, { topics, options, topMenu: false, logoColor: 'white' }, [
      h(About, { topics, articles, options }),
    ]),
  ])

module.exports = AboutPage
