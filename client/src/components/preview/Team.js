const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const { prefixUrl } = require('./layout')
const { slugify } = require('../../universal-utils')
const { capitalize } = require('lodash')

const avatarUrl = member =>
  `/assets/img/team/team-${toId(member.firstname)}_${toId(member.lastname)}.png`

const toId = lastname => slugify(lastname)

const TeamMemberModal = injectIntl(({ page, member, options, intl }) => {
  return h(
    `#${toId(member.lastname)}.modal.fade`,
    { tabIndex: -1, role: 'dialog', 'aria-labelledby': toId(member.lastname) },
    [
      h('.modal-dialog.modal-lg', { role: 'document' }, [
        h('.modal-content', {}, [
          h('.modal-body', [
            h(
              'button.close',
              {
                'data-dismiss': 'modal',
                role: 'button',
                'aria-label': intl.formatMessage({ id: 'close' }),
              },
              '⨯',
            ),
            h('.row.vcenter', [
              h('.col-md-4', [
                h('img.center-block', {
                  src: prefixUrl(avatarUrl(member), options.preview),
                  alt: `${member.firstname} ${member.lastname}`,
                }),
              ]),
              h('.col-md-8', [
                h('h2', `${member.firstname} ${member.lastname}`),
                h('h3', {}, h(T, { id: `${page}.${member.key}-title` })),
                h('p', {}, h(T, { id: `${page}.${member.key}-bio` })),
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

const TeamMember = ({ xsSize = 4, member, options }) => {
  return h(`li.col-sm-2.col-xs-${xsSize}.TeamMember`, [
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
        h('span', [
          h('span.TeamMemberName', member.firstname),
          h('span.TeamMemberName', member.lastname),
        ]),
      ],
    ),
  ])
}

const Team = ({ page, modalXsSize, options, intl }) => {
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

  const Page = capitalize(page)

  return h(`section.${Page}Team#team`, [
    h('.container', [
      h('h2', {}, h(T, { id: `${page}.the-team` })),
      h('h3', {}, h(T, { id: `${page}.the-texts` })),
      h(
        'ul',
        authors.map(member =>
          h(TeamMember, { key: member.key, member, options }),
        ),
      ),
      // Different title on 'home'
      ...(page === 'home'
        ? [
            h('h3.viz', {}, h(T, { id: `home.the-vizualisations` })),
            h('h3', {}, h(T, { id: `home.the-vizualisations-creator` })),
          ]
        : [h('h3', {}, h(T, { id: 'about.the-vizualisations' }))]),
      h(
        'ul',
        cartographers.map(member =>
          h(TeamMember, { key: member.key, member, options }),
        ),
      ),
      authors.map(member =>
        h(TeamMemberModal, {
          key: member.key,
          modalXsSize,
          page,
          member,
          options,
        }),
      ),
      cartographers.map(member =>
        h(TeamMemberModal, {
          key: member.key,
          modalXsSize,
          page,
          member,
          options,
        }),
      ),
      // Content only on 'about'
      ...(page === 'home'
        ? []
        : [
            h('h3', {}, h(T, { id: 'about.the-project' })),
            h('p', [
              h(T, { id: 'about.project.0' }),
              h('br'),
              h(T, { id: 'about.project.1' }),
              h('br'),
              h(T, { id: 'about.project.2' }),
            ]),
          ]),
    ]),
  ])
}

module.exports = Team
