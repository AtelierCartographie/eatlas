// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')
const { prefixUrl } = require('./layout')
const { slugify } = require('../../universal-utils')

const avatarUrl = member =>
  `/assets/img/team/team-${toId(member.firstname)}_${toId(member.lastname)}.png`

const toId = lastname => slugify(lastname)

const TeamMemberModal = injectIntl(({ member, options, intl }) => {
  return h(
    `#${toId(member.lastname)}.modal.fade`,
    { tabIndex: -1, role: 'dialog', 'aria-labelledby': 'modal' },
    [
      h('.modal-dialog.modal-lg', { role: 'document' }, [
        h('.modal-content', {}, [
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
                h('h3', {}, h(T, { id: `about.${member.key}-title` })),
                h('p', {}, h(T, { id: `about.${member.key}-bio` })),
                h('div.TeamMemberLinks', [
                  Boolean(member.page) &&
                    h('a', { href: member.pageURL || '' }, member.page),
                  Boolean(member.social) &&
                    h('a', { href: member.socialURL || '' }, member.social),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ],
  )
})

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
        h('div', [
          h('.TeamMemberName', member.firstname),
          h('.TeamMemberName', member.lastname),
        ]),
      ],
    ),
  ])
}

const Team = ({ options, intl }) => {
  const authors = [
    {
      firstname: 'Delphine',
      lastname: 'Allès',
      key: 'delphine-alles',
      pageURL: 'http://u-pec.academia.edu/DelphineAlles',
      page: 'Academia',
      socialURL: 'https://twitter.com/DelphineAlles',
      social: '@DelphineAlles',
    },
    {
      firstname: 'Mélanie',
      lastname: 'Albaret',
      key: 'melanie-albaret',
    },
    {
      firstname: 'Philippe',
      lastname: 'Copinschi',
      key: 'philippe-copinschi',
    },
    {
      firstname: 'Marie-Françoise',
      lastname: 'Durand',
      key: 'mf-durand',
    },
    {
      firstname: 'Lucile',
      lastname: 'Maertens',
      key: 'lucile-maertens',
      pageURL: 'https://unil.academia.edu/LucileMaertens',
      page: 'Academia',
    },
    {
      firstname: 'Delphine',
      lastname: 'Placidi-Frot',
      key: 'delphine-placidi-frot',
    },
  ]

  const cartographers = [
    {
      firstname: 'Thomas',
      lastname: 'Ansart',
      key: 'thomas-ansart',
      pageURL: 'https://thomasansart.info',
      page: 'https://thomasansart.info',
      socialURL: 'https://twitter.com/ThomasAnsart',
      social: '@ThomasAnsart',
    },
    {
      firstname: 'Benoît',
      lastname: 'Martin',
      key: 'benoit-martin',
      pageURL:
        'https://www.sciencespo.fr/cartographie/atelier-de-cartographie/',
      page: 'Atelier de cartographie',
    },
    {
      firstname: 'Patrice',
      lastname: 'Mitrano',
      key: 'patrice-mitrano',
      pageURL:
        'https://www.sciencespo.fr/cartographie/atelier-de-cartographie/',
      page: 'Atelier de cartographie',
      socialURL: 'https://twitter.com/MitranoP',
      social: '@MitranoP',
    },
    {
      firstname: 'Anouk',
      lastname: 'Pettes',
      key: 'anouk-pettes',
    },
    {
      firstname: 'Antoine',
      lastname: 'Rio',
      key: 'antoine-rio',
      socialURL: 'https://twitter.com/antoinerio',
      social: '@antoinerio',
    },
  ]

  return h('section.AboutTeam#team', [
    h('.container', [
      h('h2', {}, h(T, { id: 'about.the-team' })),
      h('h3', {}, h(T, { id: 'about.the-texts' })),
      h(
        'ul',
        authors.map(member =>
          h(TeamMember, { key: member.key, member, options }),
        ),
      ),
      h('h3', {}, h(T, { id: 'about.the-vizualisations' })),
      h(
        'ul',
        cartographers.map(member =>
          h(TeamMember, { key: member.key, member, options }),
        ),
      ),
      authors.map(member =>
        h(TeamMemberModal, { key: member.key, member, options }),
      ),
      cartographers.map(member =>
        h(TeamMemberModal, { key: member.key, member, options }),
      ),
      h('h3', {}, h(T, { id: 'about.the-project' })),
      h('p', [
        h(T, { id: 'about.project.0' }),
        h('br'),
        h(T, { id: 'about.project.1' }),
        h('br'),
        h(T, { id: 'about.project.2' }),
      ]),
    ]),
  ])
}

const About = injectIntl(({ options, intl }) => {
  return h('article.AboutPage', [
    h('header.AboutHeader', [
      h('.container', [h('h1.AboutTitle', {}, h(T, { id: 'about.title' }))]),
    ]),
    h('section.AboutProject#project', [
      h('.container', [
        h(
          'h2',
          {},
          h(Html, {}, intl.formatMessage({ id: 'about.info-title-html' })),
        ),
        h('.row.vcenter', [
          h('ul.col-sm-8.AboutInfo', [
            h('li', {}, h(T, { id: 'about.info.0' })),
            h('li', {}, h(T, { id: 'about.info.1' })),
            h('li', {}, h(T, { id: 'about.info.2' })),
            h('li', {}, h(T, { id: 'about.info.3' })),
            h('li', {}, h(T, { id: 'about.info.4' })),
            h('li', {}, h(T, { id: 'about.info.5' })),
            h('li', {}, h(T, { id: 'about.info.6' })),
          ]),
          h('a.col-sm-4.logo', [
            h('img', {
              alt: 'Sciences Po',
              src: prefixUrl('/assets/img/sciences-po.svg', options.preview),
            }),
          ]),
        ]),
      ]),
    ]),
    h(Team, { options }),
    h('section.AboutContact#contact', [
      h('.container', [
        h('h2', {}, h(T, { id: 'about.contact-title' })),
        h('.row.vcenter', [
          h('.col-sm-8', {}, h(T, { id: 'about.contact-intro' })),
          h('.col-sm-4', [
            h(
              'a.button.btn',
              {
                href: 'https://goo.gl/forms/ei1BDbWq7CDQmwfL2',
                target: '_blank',
                role: 'button',
              },
              h(T, { id: 'about.contact-button' }),
            ),
          ]),
        ]),
      ]),
    ]),
    h('section.AboutBook#book', [
      h('.container', [
        h('h2', {}, h(T, { id: 'about.the-book' })),
        h('.row', [
          h('.col-sm-6', [
            h(
              Html,
              { whitelist: 'all', component: 'p' },
              intl.formatMessage({ id: 'about.book-intro-html' }),
            ),
            h(
              'a.button.btn',
              {
                href:
                  'http://www.pressesdesciencespo.fr/fr/livre/?GCOI=27246100830530',
                target: '_blank',
                role: 'button',
              },
              h(T, { id: 'about.book-button' }),
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
})

const AboutPage = injectIntl((
  {
    topics,
    articles,
    options,
    intl,
  } /*: {
  topics: Topic[],
  articles: Resource[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: intl.formatMessage({ id: 'about.title' }), options }),
    h(Body, { topics, options, logoColor: 'white' }, [
      h(About, { topics, articles, options }),
    ]),
  ]),
)

module.exports = AboutPage
