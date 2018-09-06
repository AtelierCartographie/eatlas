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
const { slugify } = require('../../universal-utils')

const avatarUrl = member =>
  `/assets/img/team/team-${toId(member.firstname)}_${toId(member.lastname)}.png`

const toId = lastname => slugify(lastname)

const TeamMemberModal = ({ member, options }) => {
  return h(
    `#${toId(member.lastname)}.modal.fade`,
    { tabIndex: -1, role: 'dialog', 'aria-labelledby': 'modal' },
    [
      h('.modal-dialog.modal-lg', { role: 'document' }, [
        h('.modal-content', {}, [
          // TODO styling on top right without padding
          false && h('.modal-header', [
            h(
              'button.close',
              {
                type: 'button',
                'data-dismiss': 'modal',
                'aria-label': 'Close',
              },
              [h('span', { 'aria-hidden': true }, '×')],
            ),
          ]),
          h('.modal-body', [
            h('.row.vcenter', [
              h('.col-md-4', [
                h('img.center-block', {
                  src: prefixUrl(avatarUrl(member), options.preview),
                  alt: `${member.firstname} ${member.lastname}`,
                }),
              ]),
              h('.col-md-8', [
                h('h2', `${member.firstname} ${member.lastname}`),
                h('h3', member.title),
                h('p', member.bio),
                h('div.TeamMemberLinks', [
                  Boolean(member.page) &&
                    h('a', { href: member.pageURL }, member.page),
                  Boolean(member.social) &&
                    h('a', { href: member.socialURL }, member.social),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ],
  )
}

const TeamMember = ({ member, options }) => {
  return h('li.col-sm-2.col-xs-6.TeamMember', [
    h(
      'button',
      {
        'data-toggle': 'modal',
        'data-target': `#${toId(member.lastname)}`,
      },
      [
        h('img', {
          src: prefixUrl(avatarUrl(member), options.preview),
          alt: `${member.firstname} ${member.lastname}`,
        }),
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

const Team = ({ options }) => {
  const authors = [
    {
      firstname: 'Delphine',
      lastname: 'Allès',
      title: 'Professeure des universités en science politique',
      bio: `Professeure de Science politique, Delphine Allès dirige la filière Relations internationales de l’Institut national des langues et civilisations orientales (INALCO). Ses recherches portent sur le rôle de la religion dans l’espace mondial et les approches extra-occidentales de l’international.`,
      pageURL: 'http://u-pec.academia.edu/DelphineAlles',
      page: 'Academia',
      socialURL: 'https://twitter.com/DelphineAlles',
      social: '@DelphineAlles',
    },
    {
      firstname: 'Mélanie',
      lastname: 'Albaret',
      title: 'Maîtresse de conférences en sience politique',
      bio: `Docteure en science politique (relations internationales), Mélanie Albaret est maîtresse de conférences à l'Université Clermont Auvergne. Ses recherches portent sur les organisations internationales (notamment l'ONU) et sur le multilatéralisme.`,
      pageURL: '',
      page: '',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Philippe',
      lastname: 'Copinschi',
      title: 'Enseignant, consultant',
      bio: `Philippe Copinschi est docteur en science politique (relations internationales) de Sciences Po Paris. Il enseigne à la Paris School of International Affairs (PSIA) de Sciences Po Paris et travaille comme consultant indépendant dans le domaine de l’énergie, en particulier en Afrique.`,
      pageURL: '',
      page: '',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Marie-Françoise',
      lastname: 'Durand',
      title: 'Professeure agrégée de géographie',
      bio: `Professeure agrégée de géographie à Sciences Po de 1989 à 2015, Marie-Françoise Durand a créé l'Atelier de cartographie, coordonné le cours Espace mondial, la production de plusieurs MOOCs et les 6 éditions de l'Atlas de la mondialisation `,
      pageURL: '',
      page: '',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Lucile',
      lastname: 'Maertens',
      title: 'Maître-assistante en relations internationales',
      bio: `Docteure en science politique, Lucile Maertens est maître-assistante en relations internationales à l'Université de Lausanne (IEPHI) et chercheuse associée à Sciences Po/CERI. Ses recherches portent sur l'action des organisations internationales dans le domaine de l'environnement et de la sécurité.`,
      pageURL: 'https://unil.academia.edu/LucileMaertens',
      page: 'Academia',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Delphine',
      lastname: 'Placidi-Frot',
      title: 'Professeure des universités en science politique',
      bio: `Professeure de science politique, Delphine Placidi-Frot codirige les M2 Diplomatie et négociations stratégiques et Gouvernance de projets de développement durable au Sud de l'Université Paris-Saclay. Ses recherches portent sur la politique extérieure et les organisations multilatérales (notamment onusiennes).`,
      pageURL: '',
      page: '',
      socialURL: '',
      social: '',
    },
  ]

  const cartographers = [
    {
      firstname: 'Thomas',
      lastname: 'Ansart',
      title: 'cartographie, data visualisation, R',
      bio: '',
      pageURL: 'https://thomasansart.com/',
      page: 'https://thomasansart.com/',
      socialURL: 'https://twitter.com/ThomasAnsart',
      social: '@ThomasAnsart',
    },
    {
      firstname: 'Benoît',
      lastname: 'Martin',
      title: 'Géographe-cartographe et doctorant en science politique',
      bio: `Cartographe à Sciences Po depuis 2006, ses recherches portent sur la production des statistiques internationales – sa thèse de Doctorat explore le cas de l’UNODC, sur la drogue et le crime – et notamment les enjeux politiques qui entourent les activités d’expertise des organisations internationales.`,
      pageURL: 'https://www.sciencespo.fr/cartographie/atelier-de-cartographie/',
      page: 'Atelier de cartographie',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Patrice',
      lastname: 'Mitrano',
      title: 'Géographe-cartographe',
      bio: `Patrice Mitrano participe à la vie de l'Atelier de cartographie depuis 1998. Il y conçoit et réalise des cartes, bien sûr, mais aussi toutes sortes d'autres images qu'on nommerait rapidement "viz". Un projet qui l'aura marqué ? L'accompagnement de la mise en place du département des Arts de l'Islam au Louvre en 2012. (318)`,
      pageURL: 'https://www.sciencespo.fr/cartographie/atelier-de-cartographie/',
      page: 'Atelier de cartographie',
      socialURL: 'https://twitter.com/MitranoP',
      social: '@MitranoP',
    },
    {
      firstname: 'Anouk',
      lastname: 'Pettes',
      title: 'Géographe-cartographe',
      bio: '',
      pageURL: '',
      page: '',
      socialURL: '',
      social: '',
    },
    {
      firstname: 'Antoine',
      lastname: 'Rio',
      title: 'Géographe-cartographe',
      bio: '',
      pageURL: '',
      page: '',
      socialURL: 'https://twitter.com/antoinerio',
      social: '@antoinerio',
    },
  ]

  return h('section.AboutTeam#team', [
    h('.container', [
      h('h2', "L'équipe"),
      h('h3', 'Les textes'),
      h('ul', authors.map((member, key) => h(TeamMember, { key, member, options }))),
      h('h3', 'Les visualisations (Sciences Po - Atelier de cartographie)'),
      h('ul', cartographers.map((member, key) => h(TeamMember, { key, member, options }))),
      authors.map((member, key) => h(TeamMemberModal, { key, member, options })),
      cartographers.map((member, key) => h(TeamMemberModal, { key, member, options })),
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
        h('.row.vcenter', [
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
    h(Team, { options }),
    h('section.AboutContact#contact', [
      h('.container', [
        h('h2', 'Nous contacter'),
        h('.row.vcenter', [
          h('.col-sm-8', [
            'Entrer en contact avec les rédacteurs et les cartographes',
          ]),
          h('.col-sm-4', [
            h(
              'a.button.btn',
              { href: 'https://goo.gl/forms/ei1BDbWq7CDQmwfL2', target: '_blank', role: 'button' },
              'Nous contacter',
            ),
          ]),
        ]),
      ]),
    ]),
    h('section.AboutBook#book', [
      h('.container', [
        h('h2', 'Le livre'),
        h('.row', [
          h('.col-sm-6', [
            h(
              'p',
              'Espace Mondial : l’Atlas est aussi un beau livre papier publié aux Presses de Sciences Po. Lipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
            ),
            h(
              'a.button.btn',
              { href: 'http://www.pressesdesciencespo.fr/fr/livre/?GCOI=27246100830530', target: '_blank', role: 'button' },
              'Acheter le livre',
            ),
          ]),
          h('.col-sm-6', [
            h('img.img-responsive', {
              alt: '',
              src: prefixUrl('/assets/img/eatlas-paper.png', options.preview),
            }),
          ]),
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
  options: FrontOptions,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'À propos', options }),
    h(Body, { topics, options, logoColor: 'white' }, [
      h(About, { topics, articles, options }),
    ]),
  ])

module.exports = AboutPage
