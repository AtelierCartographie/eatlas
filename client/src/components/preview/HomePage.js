// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
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
    h('video.HomeVideo', { autoPlay: true, loop: true }, [
      h('source', {
        type: 'video/mp4',
        src: prefixUrl('/assets/viz-home-bg-1080p.mp4', options.preview),
      }),
    ]),
    h('header.container.HomeHeader', [
      h('h1.HomeTitle', 'Un atlas pour comprendre'),
      h('h1.HomeTitle.HomeTitleTyped', "l'espace mondial contemporain"),
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
    h('section.HomeTopics', [
      h('.container', [
        h('h2', 'Sommaire'),
        h(
          'p',
          "Regarder le monde comme un espace mobile et fluide. S’émanciper de l’idée d’une scène internationale orchestrée par les seuls États. Sortir des figures classiques de l’ennemi, de la frontière, des identités exclusives. Montrer tous les acteurs des échanges internationaux, qu’ils soient publics ou privés, individuels ou collectifs, politiques, économiques et sociaux, locaux, nationaux, régionaux ou mondiaux. Représenter les innombrables interdépendances et enchevêtrements de nos histoires,  autant que les désordres et les dysfonctionnements d’un monde complexe et inégal. Apporter quelques notes à la partition du vivre-ensemble. Telle est l’ambition de cet atlas.",
        ),
        h('.row.gutter', [
          h('.col-xs-6.col-md-4', [
            h('a.HomeTopic.vcenter', { href: getTopicPageUrl(topics[0], options) }, [
              h('.TopicNumber'),
              h('.TopicName', topics[0].name),
            ]),
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
            h(
              'p',
              'Lorem ipsum dolor sit amet, cartes et graphiques consectetuer adipiscing elit, sed diam nonummy nibh  euismod tincidunt ut laoreet dolore magna aliquam  erat  photos  volutpat. Ut wisi enim ad minim veniam,  quis nostrud exerci tation  lexique ullamcorper suscipit  lobortis nisl ut aliquip ex ea commodo consequat. Duis  autem vel eum iriure dolor in hendrerit in vulputate  velit esse molestie consequat, vel illum dolore eu',
            ),
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
            h(
              'p',
              'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
            ),
            h(
              'a.more',
              { href: globalPageUrl('project')(options.preview) },
              'En savoir plus >',
            ),
          ]),
          h('.col-sm-4..col-sm-pull-8.logo', [
            h('img', {
              alt: 'Sciences Po',
              src: prefixUrl('/assets/img/sciences-po.svg', options.preview),
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
          { href: globalPageUrl('team')(options.preview) },
          'En savoir plus >',
        ),
      ]),
    ]),
    h('section.HomeBook', [
      h('.container', [
        h('.row', [
          h('.col-sm-6.col-sm-push-6.text-right', [
            h('h2.text-right', 'Le livre'),
            h(
              'p',
              'Espace Mondial : l’Atlas est aussi un beau livre publié aux Presses de Sciences Po.',
            ),
            h(
              'a.more',
              { href: globalPageUrl('book')(options.preview) },
              'En savoir plus >',
            ),
            h('div', [
              h(
                'a.button.btn',
                { href: 'http://www.pressesdesciencespo.fr/fr/livre/?GCOI=27246100830530', target: '_blank', role: 'button' },
                'Acheter le livre',
              )]),
          ]),
          h('.col-sm-6.col-sm-pull-6', [
            h('img', {
              alt: '',
              src: prefixUrl('/assets/img/eatlas-paper.png', options.preview),
            }),
          ]),
        ]),
      ]),
    ]),
  ])
}

const HomePage = ({
  topics,
  options,
} /*: {
  topics: Topic[],
  articles: Resource[],
  options: FrontOptions,
} */) =>
  h('html', { lang: 'fr' }, [
    h(Head, { title: 'eAtlas', options }),
    h(Body, { topics, options, logoColor: 'white' }, [
      h(Home, { topics, options }),
    ]),
  ])

module.exports = HomePage
