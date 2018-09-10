const Html = require('./Html')

module.exports = (h, code) => [
  h('script', {
    async: true,
    src: `https://www.googletagmanager.com/gtag/js?id=${code}`,
  }),
  h(Html, { component: 'script' }, js(code)),
]

const js = code => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${code}');
`
