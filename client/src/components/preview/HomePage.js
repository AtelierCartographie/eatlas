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
const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')

// subcomponents

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
      h('div', [
        h('input.search-field', {
          placeholder: intl.formatMessage({ id: 'fo.search.placeholder' }),
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
        h('p', {}, h(T, { id: 'home.topics-intro' })),
        h('h2', {}, h(T, { id: 'fo.nav-summary' })),
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
        h('h2', {}, h(T, { id: 'fo.nav-resources' })),
        h('.row', [
          h('.col-sm-8', [
            h(
              Html,
              { whitelist: 'all' },
              intl.formatMessage(
                { id: 'home.resources-intro-html' },
                {
                  mapsUrl: getSearchUrl({ types: ['map'] }, options),
                  imagesUrl: getSearchUrl({ types: ['image'] }, options),
                  lexiconUrl: globalPageUrl('definition')(options),
                },
              ),
            ),
          ]),
          h('.col-sm-4'),
        ]),
      ]),
    ]),
    h('section.HomeProject', [
      h('.container', [
        h('h2.text-right', {}, h(T, { id: 'fo.nav-about' })),
        h('.row.vcenter', [
          h('.col-sm-8.col-sm-push-4.text-right', [
            h(
              Html,
              { whitelist: 'all' },
              intl.formatMessage({ id: 'home.about-intro-html' }),
            ),
            h(
              'a.more',
              {
                href: globalPageUrl('about', null, 'project')(options),
              },
              [h(T, { id: 'home.read-more-label' }), ' >'],
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
        h('h2', {}, h(T, { id: 'about.the-team' })),
        h('h3', {}, h(T, { id: 'about.the-texts' })),
        h('p', {}, h(T, { id: 'home.text-people' })),
        h('h3', {}, h(T, { id: 'home.the-vizualisations' })),
        h('p', {}, h(T, { id: 'home.vizualisation-people' })),
        h('a.more', { href: globalPageUrl('about', null, 'team')(options) }, [
          h(T, { id: 'home.read-more-label' }),
          ' >',
        ]),
      ]),
    ]),
    h('section.HomeBook', [
      h('.container', [
        h('.row', [
          h('.col-sm-6.col-sm-push-6.text-right', [
            h('h2.text-right', {}, h(T, { id: 'about.the-book' })),
            h(
              Html,
              { whitelist: 'all' },
              intl.formatMessage({ id: 'home.book-intro-html' }),
            ),
            h(
              'a.more',
              { href: globalPageUrl('about', null, 'book')(options) },
              [h(T, { id: 'home.read-more-label' }), ' >'],
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
                h(T, { id: 'about.book-button' }),
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
