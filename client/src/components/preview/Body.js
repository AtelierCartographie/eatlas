// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')

const { CDN, prefixUrl } = require('./layout')
const TopBar = require('./TopBar')
const { SideMenu } = require('./SideMenu')
const Footer = require('./Footer')
const Html = require('./Html')

module.exports = injectIntl((
  {
    topics,
    logoColor = 'white',
    altTitle,
    options,
    children,
    scripts = [],
    linkContent = '#main-content',
    className = '',
    intl,
  } /*: {
  topics: Topic[],
  logoColor: 'black' | 'white',
  options: FrontOptions,
  children: any,
} */,
) =>
  // display preview ribbon in corner
  h(`body.${className}${options.preview ? '.preview' : ''}`, [
    h('header', { role: 'banner' }, [
      h(SideMenu, {
        topics,
        options: {
          ...options,
          hideLangSelector: true, // never included in SideMenu anymore (refs #202)
        },
      }),
      h(TopBar, { altTitle, logoColor, linkContent, options }),
    ]),
    h('main#main-content', { role: 'main' }, [children]),
    h(Footer, { topics, options }),
    h('script', {
      // Array.from, URLSearchParams, and other features required by eatlas.js
      src: 'https://cdn.polyfill.io/v2/polyfill.min.js',
    }),
    h('script', {
      // Polyfill for CSS object-fit in IE
      src: prefixUrl('/assets/js/fitie.js', options.preview),
    }),
    h('script', {
      src: `${CDN}/jquery/3.3.1/jquery.slim.min.js`,
    }),
    h('script', {
      src: prefixUrl('/assets/js/lodash.custom.min.js', options.preview),
    }),
    h('script', {
      src: prefixUrl('/assets/js/bootstrap.custom.min.js', options.preview),
    }),
    h('script', {
      src: `${CDN}/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/picturefill/3.0.3/picturefill.min.js`,
    }),
    ...scripts.map(src => h('script', { src })),
    h(
      Html,
      { component: 'script' },
      `window.CAROUSEL_PREVIOUS=${JSON.stringify(
        intl.formatMessage({
          id: 'home.carousel-previous',
        }),
      )}; window.CAROUSEL_NEXT=${JSON.stringify(
        intl.formatMessage({
          id: 'home.carousel-next',
        }),
      )}; window.SEARCH_DEFAULT_LANG=${JSON.stringify(
        intl.lang,
      )}; window.WARNING_URL_ERROR=${JSON.stringify(
        intl.formatMessage(
          {
            id: 'fo.warning-url-error',
          },
          { code: 'CODE' },
        ),
      )}; window.CONTACT_URL=${JSON.stringify(
        process.env.REACT_APP_CONTACT_URL,
      )};`,
    ),
    h('script', {
      src: prefixUrl('/assets/js/eatlas.es5.js', options.preview),
    }),
  ]),
)
