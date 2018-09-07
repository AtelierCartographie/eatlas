module.exports = (h, code) => [
  h('script', {
    async: true,
    src: `https://www.googletagmanager.com/gtag/js?id=${code}`,
  }),
  h('script', { dangerouslySetInnerHTML: { __html: js(code) } }),
]

const js = code => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${code}');
`
