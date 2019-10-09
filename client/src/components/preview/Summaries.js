const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')

module.exports = injectIntl(({ doc, intl, id }) => {
  const mainText = doc[`description_${intl.lang}`]
  const mainDescription = mainText ? { lang: intl.lang, text: mainText } : null

  if (!mainDescription || mainDescription.text.length < 10) {
    return null
  }

  return h('section.container.Summaries' + (id ? '#' + id : ''), [
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
    ]),
  ])
})
