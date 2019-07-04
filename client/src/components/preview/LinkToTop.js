const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')

// floating buttons on each side of the screen
const LinkToTop = injectIntl(
  ({
    intl,
    href = '#main-content',
    text = intl.formatMessage({ id: 'fo.link-to-top' }),
  }) => [
    h(
      'a.LinkToTop',
      { href, title: intl.formatMessage({ id: 'fo.link-to-top' }) },
      [h('span', text)],
    ),
    // horrible pattern? yes? no? who knows?
    h(
      Html,
      { component: 'script' },
      `
window.addEventListener('DOMContentLoaded', () => {
  if (!window.IntersectionObserver) return
  const toggle = (sel, bool) => {
    const el = document.querySelector(sel)
    if (el) el.classList.toggle('hidden', bool)
  }
  const observer = new IntersectionObserver((entries) => {
    const hidden = entries[0].isIntersecting
    toggle('.LinkToTop', hidden)
  })
  observer.observe(document.querySelector('header'))
})
`,
    ),
  ],
)

module.exports = LinkToTop
