// @flow

// component also used for SSR, so:
// - require instead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const Head = require('./Head')
const Body = require('./Body')
const Html = require('./Html')
const Team = require('./Team')
const { prefixUrl } = require('./layout')

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
    h(Team, { page: 'about', modalXsSize: 6, options }),
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
                title: `${intl.formatMessage(
                  { id: 'fo.link-new-window-title' },
                  { title: intl.formatMessage({ id: 'about.contact-button' }) },
                )}`,
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
                title: `${intl.formatMessage(
                  { id: 'fo.link-new-window-title' },
                  { title: intl.formatMessage({ id: 'about.book-button' }) },
                )}`,
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
