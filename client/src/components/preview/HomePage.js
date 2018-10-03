// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const moment = require('moment')
moment.locale('fr')

const {
  prefixUrl,
  getSearchUrl,
  getTopicPageUrl,
  globalPageUrl,
} = require('./layout')
const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const Home = ({ topics, options }) => {
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
      h('h1.HomeTitle', 'Un atlas pour comprendre'),
      h('h1.HomeTitle.HomeTitleTyped', "l'espace mondial contemporain"),
      h('div', [
        h('input.search-field', {
          placeholder: "Rechercher dans l'atlas",
          'data-search-page-url': getSearchUrl({}, options),
        }),
        h('button', [
          h('img', {
            alt: '',
            src: prefixUrl('/assets/img/search-white.svg', options.preview),
          }),
        ]),
      ]),
    ]),
    h('section.HomeTopics', [
      h('.container', [
        h(
          'p',
          'Regarder le monde comme un espace mobile et fluide en s’émancipant de l’idée d’une scène internationale orchestrée par les seuls États et les notions d’ennemi, de frontière et d’identités exclusives.  Étudier la façon dont les processus de mondialisation façonnent les politiques publiques et les comportements sociaux. Montrer comment tous les acteurs - publics ou privés, individuels ou collectifs, politiques, économiques et sociaux, locaux, nationaux, régionaux ou mondiaux- interagissent, échangent, coopèrent ou s’affrontent. Représenter les interdépendances et les enchevêtrements de nos histoires, autant que les désordres et les dysfonctionnements d’un monde complexe et inégal. Telle est l’ambition de cet atlas qui aborde ces enjeux de façon transdisciplinaire en croisant les approches de géographes et de politistes spécialistes des relations internationales.',
        ),
        h('h2', 'Sommaire'),
        h('.row.gutter', [
          h('.col-xs-6.col-md-4', [
            h(
              'a.HomeTopic.vcenter',
              { href: getTopicPageUrl(topics[0], options) },
              [h('.TopicNumber'), h('.TopicName', topics[0].name)],
            ),
          ]),
        ]),
        h(
          '.row.gutter',
          topics
            .slice(1)
            .map(t =>
              h('.col-xs-6.col-md-4', { key: t.id }, [
                h('a.HomeTopic', { href: getTopicPageUrl(t, options) }, [
                  h('.TopicNumber', t.id),
                  h('.TopicName', t.name),
                ]),
              ]),
            ),
        ),
      ]),
    ]),
    h('section.HomeResources', [
      h('.container', [
        h('h2', 'Ressources'),
        h('.row', [
          h('.col-sm-8', [
            h('p', [
              h('em', 'Espace mondial : l’Atlas'),
              ' est aussi un moteur de recherche donnant accès à plus de 200 ',
              h(
                'a',
                { href: getSearchUrl({ types: ['map'] }, options) },
                'cartes et graphiques',
              ),
              ' qui enrichissent les articles et les focus, à des ',
              h(
                'a',
                { href: getSearchUrl({ types: ['image'] }, options) },
                'photos',
              ),
              ' commentées ou à un ',
              h('a', { href: globalPageUrl('definition')(options) }, 'lexique'),
              ' regroupant les notions clés.',
            ]),
          ]),
          h('.col-sm-4'),
        ]),
      ]),
    ]),
    h('section.HomeProject', [
      h('.container', [
        h('h2.text-right', 'À propos'),
        h('.row.vcenter', [
          h('.col-sm-8.col-sm-push-4.text-right', [
            h('p', [
              'Aventure collective et prolongement d’un cours phare de Sciences Po, ',
              h('em', 'Espace mondial : l’Atlas'),
              ' offre un accès libre et gratuit à des contenus scientifiques sur les grandes problématiques de notre temps.',
            ]),
            h(
              'a.more',
              {
                href: globalPageUrl('about', null, 'project')(options),
              },
              'En savoir plus >',
            ),
          ]),
          h('.col-sm-4..col-sm-pull-8.logo', [
            h('img', {
              alt: 'Sciences Po',
              src: prefixUrl('/assets/img/sciences-po.svg', options),
            }),
          ]),
        ]),
      ]),
    ]),
    h('section.HomeTeam', [
      h('.container', [
        h('h2', "L'équipe"),
        h('h3', 'Les textes'),
        h(
          'p',
          'Delphine Allès, Mélanie Albaret, Philippe Copinschi, Marie-Françoise Durand, Lucile Maertens et Delphine Placidi-Frot',
        ),
        h('h3', 'Les visualisations'),
        h(
          'p',
          'Sciences Po - Atelier de cartographie : Thomas Ansart, Benoît Martin, Patrice Mitrano, Anouk Pettes et Antoine Rio',
        ),
        h(
          'a.more',
          { href: globalPageUrl('about', null, 'team')(options) },
          'En savoir plus >',
        ),
      ]),
    ]),
    h('section.HomeBook', [
      h('.container', [
        h('.row', [
          h('.col-sm-6.col-sm-push-6.text-right', [
            h('h2.text-right', 'Le livre'),
            h('p', [
              h('em', 'Espace mondial : l’Atlas'),
              ' est aussi un beau livre publié aux Presses de Sciences Po.',
            ]),
            h(
              'a.more',
              { href: globalPageUrl('about', null, 'book')(options) },
              'En savoir plus >',
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
                'Acheter le livre',
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
    h(Head, { title: 'Accueil', options }),
    h(Body, { topics, options, logoColor: 'white' }, [
      h(Home, { topics, options }),
    ]),
  ]),
)

module.exports = HomePage
