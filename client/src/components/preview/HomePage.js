// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const {
  prefixUrl,
  getSearchUrl,
  getTopicPageUrl,
  globalPageUrl,
} = require('./layout')
const { slugify } = require('../../universal-utils')
const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')

// subcomponents
const featuresUrl = features =>
  `/assets/img/features/features-${features}.svg`

const featuresList = injectIntl(({ features, options, intl }) => {
  return h('li.col-sm-4.col-xs-6.FeaturesList', [
      h('img', {
        src: prefixUrl(featuresUrl(features), options.preview),
        alt: `features-picto`,
      }),
      h('div', [
        h('.FeaturesTitle', {}, h(Html, {}, intl.formatMessage({ id: `home.features.${features}` }))),
      ]),
    ],
  )
})

const featuresNum = [
  '0', '1', '2', '3', '4'
]

const Features = ({ options, intl }) => {
  return  h('section.HomeFeatures#features', [
    h('.container', [
      h(
        'ul',
        featuresNum.map(features =>
          h(featuresList, { features, options }),
        ),
      ),
    ]),
  ])
}

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
                h('h3', {}, h(T, { id: `home.${member.key}-title` })),
                h('p', {}, h(T, { id: `home.${member.key}-bio` })),
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
  return h('li.col-sm-2.col-xs-4.TeamMember', [
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

  return h('section.HomeTeam#team', [
    h('.container', [
      h('h2', {}, h(T, { id: 'home.the-team' })),
      h('h3', {}, h(T, { id: 'home.the-texts' })),
      h(
        'ul',
        authors.map(member =>
          h(TeamMember, { key: member.key, member, options }),
        ),
      ),
      h('h3', {}, h(T, { id: 'home.the-vizualisations' })),
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
      h('h3', {}, h(T, { id: 'home.the-project' })),
      h('p', [
        h(T, { id: 'home.project.0' }),
        h('br'),
        h(T, { id: 'home.project.1' }),
        h('br'),
        h(T, { id: 'home.project.2' }),
      ]),
    ]),
  ])
}

const Home = ({ topics, options, intl }) => {
  return h('article.HomePage', [
    h('.HomeVideo', {}, [
      h(
        'video',
        {
          autoPlay: true,
          muted: true,
          loop: true,
          poster: prefixUrl('/assets/viz-home-bg-poster.jpg', options.preview),
        },
        [
          h('source', {
            type: 'video/mp4',
            src: prefixUrl('/assets/viz-home-bg-720p.mp4', options.preview),
          }),
        ],
      ),
    ]),
    h('header.container.HomeHeader', [
      h('h1.HomeTitle', {}, h(T, { id: 'home.title' })),
      h('h1.HomeTitle.HomeTitleTyped', {}, h(T, { id: 'home.subtitle' })),
    ]),
    h('section.HomeTopics', [
      h('.container', [
        h('h2', {}, h(T, { id: 'home.topics-title' })),
        h(
          '.row.gutter',
          topics
            .slice(1)
            .map(t =>
              h('.col-xs-6.col-sm-4', { key: t.id }, [
                h('a.HomeTopic', { href: getTopicPageUrl(t, options) }, [
                  h('.TopicNumber', t.id),
                  h('.TopicName', t.name),
                ]),
              ]),
            ),
        ),
      ]),
    ]),
    h(Features, { options }),
    // h('section.HomeProject', [
    //   h('.container', [
    //     h('img', {
    //       alt: 'Sciences Po',
    //       src: prefixUrl('/assets/img/sciences-po.svg', options),
    //     }),
    //   ]),
    // ]),
    h(Team, { options }),
    h('section.HomeContact#contact', [
      h('.container', [
        h('h2', {}, h(T, { id: 'home.contact-title' })),
        h('div', [
          h(T, { id: 'home.contact-intro' }),
        ]),
        h('div', [
          h(
            'a.button.btn',
            {
              href: 'https://goo.gl/forms/ei1BDbWq7CDQmwfL2',
              target: '_blank',
              role: 'button',
            },
            h(T, { id: 'home.contact-button' }),
          ),
        ]),
      ]),
    ]),
    h('section.HomeBook', [
      h('.container', [
        h('.row', [
          h('.col-sm-6.col-sm-push-6.text-right', [
            h('h2.text-right', {}, h(T, { id: 'home.the-book' })),
            h(
              Html,
              { whitelist: 'all' },
              intl.formatMessage({ id: 'home.book-intro-html' }),
            ),
            h('div', [
              h(
                'a.button.btn',
                {
                  href:
                    'http://www.pressesdesciencespo.fr/fr/livre/?GCOI=27246100830530',
                  target: '_blank',
                  role: 'button',
                },
                h(T, { id: 'home.book-button' }),
              ),
            ]),
          ]),
          h('.col-sm-6.col-sm-pull-6', [
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

const HomePage = injectIntl((
  {
    topics,
    options,
    intl,
  } /*: {
  topics: Topic[],
  articles: Resource[],
  options: FrontOptions,
} */,
) =>
  h('html', { lang: intl.lang }, [
    h(Head, { title: intl.formatMessage({ id: 'home.title-meta' }), options }),
    h(Body, { topics, options, logoColor: 'white' }, [
      h(Home, { topics, options, intl }),
    ]),
  ]),
)

module.exports = HomePage
