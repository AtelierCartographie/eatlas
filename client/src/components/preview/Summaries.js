const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')

module.exports = injectIntl(({ doc, intl }) => {
  const mainText = doc[`description_${intl.lang}`]
  const mainDescription = mainText ? { lang: intl.lang, text: mainText } : null
  const otherLang = intl.lang === 'fr' ? 'en' : 'fr'
  const otherText = doc[`description_${otherLang}`]
  const otherDescription = otherText
    ? { lang: otherLang, text: otherText }
    : null

  if (!mainDescription || mainDescription.text.length < 10) {
    return null
  }

  return h('section.container.Summaries', [
    // pills
    otherDescription &&
      h('ul.langs', { role: 'tablist' }, [
        h('li.active', { role: 'presentation' }, [
          h(
            'a',
            {
              href: `#${mainDescription.lang}`,
              role: 'tab',
              'data-toggle': 'pill',
              hrefLang: mainDescription.lang,
            },
            intl.formatMessage({
              id: `common.summary-lang.${mainDescription.lang}`,
            }),
          ),
        ]),
        h('li', { role: 'presentation' }, [
          h(
            'a',
            {
              href: `#${otherDescription.lang}`,
              role: 'tab',
              'data-toggle': 'pill',
              hrefLang: otherDescription.lang,
            },
            intl.formatMessage({
              id: `common.summary-lang.${otherDescription.lang}`,
            }),
          ),
        ]),
      ]),
    h('.tab-content', [
      h(
        `.tab-pane.active#${mainDescription.lang}`,
        { role: 'tabpanel', lang: mainDescription.lang },
        [
          h(
            'h2.line',
            intl.formatMessage({
              id: `common.summary-title.${mainDescription.lang}`,
            }),
          ),
          h(Html, { whitelist: 'all' }, mainDescription.text),
        ],
      ),
      otherDescription &&
        h(
          `.tab-pane#${otherDescription.lang}`,
          { role: 'tabpanel', lang: otherDescription.lang },
          [
            h(
              'h2.line',
              intl.formatMessage({
                id: `common.summary-title.${otherDescription.lang}`,
              }),
            ),
            h(Html, { whitelist: 'all' }, otherDescription.text),
          ],
        ),
    ]),
  ])
})
