// @flow

const h = require('react-hyperscript')

const { CDN, prefixUrl } = require('./layout')
const { TopMenu } = require('./TopMenu')
const { SideMenu, SideMenuToggle } = require('./SideMenu')
const Footer = require('./Footer')

const NavBar = ({ logoColor, options: { preview } }) =>
  h('nav.navbar.navbar-default.navbar-static-top.navbar-logo', [
    h('div.container', [
      h('a.navbar-brand', { href: preview ? '/preview' : 'TODO' }, [
        h('img', {
          alt: "Page d'accueil",
          src: prefixUrl(`/assets/img/logo-eatlas-${logoColor}.svg`, preview),
        }),
      ]),
    ]),
  ])

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
    h(NavBar, { logoColor: logoColor || 'white', options }),
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
    h('script', { src: prefixUrl('/assets/js/eatlas.js', options.preview) }),
  ])
