// @flow

const h = require('react-hyperscript')

const { CDN, prefixUrl } = require('./layout')
const TopBar = require('./TopBar')
const { TopMenu } = require('./TopMenu')
const { SideMenu, SideMenuToggle } = require('./SideMenu')
const Footer = require('./Footer')

module.exports = (
  {
    topic,
    topics,
    articles,
    sideMenu,
    topMenu,
    logoColor,
    options,
    children,
  } /*:{ topic: Topic, topics: Topic[], articles: Resource[], sideMenu: any, topMenu: any, logoColor: string, options: Object, children: any} */,
) =>
  // display preview ribbon in corner
  h('body', { className: options.preview ? 'preview' : '' }, [
    h(TopBar, { logoColor: logoColor || 'white', options }),
    sideMenu && h(SideMenuToggle, { options }),
    sideMenu && h(SideMenu, { topics, options }),
    topMenu && h(TopMenu, { topic, topics, articles, options }),
    h('main', { role: 'main' }, [children]),
    h(Footer, { topics, options }),
    h('script', {
      src: `${CDN}/jquery/3.3.1/jquery.min.js`,
    }),
    h('script', {
      src: `${CDN}/lodash.js/4.17.5/lodash.min.js`,
    }),
    h('script', {
      src: `${CDN}/twitter-bootstrap/3.3.7/js/bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js`,
    }),
    h('script', {
      src: `${CDN}/picturefill/3.0.3/picturefill.min.js`,
    }),
    h('script', { src: prefixUrl('/assets/js/eatlas.js', options.preview) }),
  ])
