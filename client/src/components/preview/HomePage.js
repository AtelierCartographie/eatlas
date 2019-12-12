// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const {
  prefixUrl,
  getTopicPageUrl,
  CDN,
  getImageUrl,
  getResourcePageUrl,
} = require('./layout')
const { topicName, stripTags } = require('../../universal-utils')
const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')
const Team = require('./Team')

// subcomponents
const featuresUrl = features => `/assets/img/features/features-${features}.svg`

const featuresList = injectIntl(({ features, options, intl }) => {
  return h('li.col-sm-4.col-xs-6.FeaturesList', [
    h('img', {
      src: prefixUrl(featuresUrl(features), options.preview),
      alt: '',
    }),
    h('div', [
      h(
        '.FeaturesTitle',
        {},
        h(Html, {}, intl.formatMessage({ id: `home.features.${features}` })),
      ),
    ]),
  ])
})

const featuresNum = ['0', '1', '2']

const Features = ({ options, intl }) => {
  return h('section.HomeFeatures#features', [
    h('.container', [
      h(
        'ul',
        featuresNum.map(features => h(featuresList, { features, options })),
      ),
    ]),
  ])
}

const carouselSettings = nbArticles => (
  slides,
  centerPadding = '50px',
  breakpoint = null,
  additionalSettings = {},
) => {
  const settings = {
    slidesToShow: Math.min(nbArticles, slides),
    centerPadding,
    initialSlide:
      nbArticles > slides
        ? // Use special value `RAND${min}-${max}` that will be dynamically replaced client-side
          // If we call Math.random() here, the randomization will be done only once at generation-time
          `RAND0-${nbArticles - 1}` // Do not start with last slide as it breaks initial display
        : 0, // Not enough articles: set to 0 or we'll have ugly offset
    ...additionalSettings,
  }
  return breakpoint ? { breakpoint, settings } : settings
}

const TopicCarousel = ({
  topic,
  articles,
  options,
  intl,
  lazyLoading = false,
}) => {
  const settings = carouselSettings(articles.length)
  if (articles.length === 0) {
    return null
  }
  return h(
    `.TopicCarousel.carousel`,
    {
      'data-slick': JSON.stringify({
        dots: true,
        arrows: true,
        infinite: true,
        ...settings(2, ''),
        responsive: [
          settings(2, '40px', 768, { arrows: false }),
          settings(1, '40px', 600, { arrows: false, centerMode: true }),
        ],
      }),
    },
    articles.map(a =>
      h(
        `.TopicCarouselItem.carousel-item`,
        { key: a.id },
        h(
          'a',
          {
            href: getResourcePageUrl(a, options),
          },
          [
            a.carouselImage
              ? h(
                  '.image',
                  lazyLoading
                    ? {
                        'data-lazy-background-image': getImageUrl(
                          a.carouselImage.resource,
                          a.carouselImage.size,
                          a.carouselImage.density,
                          options,
                        ),
                      }
                    : {
                        style: {
                          backgroundImage: `url(${getImageUrl(
                            a.carouselImage.resource,
                            a.carouselImage.size,
                            a.carouselImage.density,
                            options,
                          )})`,
                        },
                      },
                )
              : null,
            h('.caption', stripTags(a.title)),
          ],
        ),
      ),
    ),
  )
}

const Topics = ({ topics, articles, options, intl }) =>
  h(
    'section.HomeTopics#home-main-content',
    topics.slice(1).map(t =>
      h('.HomeTopic.container', { key: t.id }, [
        h(
          'h2',
          {},
          h(
            'a',
            { href: getTopicPageUrl(t, options) },
            `${t.id}. ${topicName(t, intl.lang)}`,
          ),
        ),
        h(TopicCarousel, {
          topic: t,
          articles: articles.filter(a => a.topic === t.id),
          options,
          intl,
          key: t.id,
        }),
      ]),
    ),
  )

const Home = ({ topics, articles, options, intl }) => {
  return h('article.HomePage', [
    h('.HomeVideo', {}, [
      h(
        'video#HomeVideo',
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
    h(
      'button.HomeVideoController.playing',
      {
        'aria-label': intl.formatMessage({ id: 'fo.pause-home-video' }),
        title: intl.formatMessage({ id: 'fo.pause-home-video' }),
        'data-label-pause': intl.formatMessage({ id: 'fo.pause-home-video' }),
        'data-label-play': intl.formatMessage({ id: 'fo.play-home-video' }),
        'aria-controls': 'HomeVideo',
      },
      [
        h('img.iconPlay', {
          'aria-hidden': 'true',
          alt: '▶',
          src: prefixUrl('/assets/img/play.svg', options.preview),
        }),
        h('img.iconPause', {
          alt: '⏸',
          src: prefixUrl('/assets/img/pause.svg', options.preview),
        }),
      ],
    ),
    h(Topics, { topics, articles, options, intl }),
    h(Features, { options }),
    // h('section.HomeProject', [
    //   h('.container', [
    //     h('img', {
    //       alt: 'Sciences Po',
    //       src: prefixUrl('/assets/img/sciences-po.svg', options),
    //     }),
    //   ]),
    // ]),
    h(Team, { page: 'home', modalXsSize: 4, options }),
    h('section.HomeProject#project', [
      h('.container', [
        h('h2', {}, h(T, { id: 'home.the-project' })),
        h('p', {}, h(T, { id: 'home.project' })),
        h('img', {
          alt: 'Sciences Po',
          src: prefixUrl('/assets/img/sciences-po.svg', options),
        }),
      ]),
    ]),
    h('section.HomeContact#contact', [
      h('.container', [
        h('h2', {}, h(T, { id: 'home.contact-title' })),
        h('div', [h(T, { id: 'home.contact-intro' })]),
        h('div', [
          h(
            'a.button.btn',
            {
              href: 'https://goo.gl/forms/ei1BDbWq7CDQmwfL2',
              target: '_blank',
              role: 'button',
              title: `${intl.formatMessage(
                { id: 'fo.link-new-window-title' },
                { title: intl.formatMessage({ id: 'home.contact-button' }) },
              )}`,
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
                  title: `${intl.formatMessage(
                    { id: 'fo.link-new-window-title' },
                    { title: intl.formatMessage({ id: 'home.book-button' }) },
                  )}`,
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
    h(Head, {
      title: intl.formatMessage({ id: 'home.title-meta' }),
      options,
      styles: [`${CDN}/slick-carousel/1.9.0/slick.css`],
    }),
    h(
      Body,
      {
        topics,
        options,
        logoColor: 'white',
        scripts: [`${CDN}/slick-carousel/1.9.0/slick.min.js`],
        linkContent: '#home-main-content',
      },
      [h(Home, { topics, articles, options, intl })],
    ),
  ]),
)

module.exports = HomePage
