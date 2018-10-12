// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')
const { LOCALES } = require('../../universal-utils')

module.exports = injectIntl(({ options, intl }) =>
  h(
    '.LangSelector',
    Object.keys(LOCALES).map(lang =>
      h(LangLink, { intl, key: lang, lang, url: intl.urls[lang] }),
    ),
  ),
)

const LangLink = (module.exports.LangLink = ({
  intl,
  lang,
  url,
  label = `common.lang-selector-label-html.${lang}`,
}) => {
  if (intl.lang === lang) {
    return h(CurrentLangLink, { intl, lang, label })
  }

  if (!url) {
    return h(DisabledLangLink, { intl, lang, label })
  }

  return h(
    `a.LangLink.${lang}.other`,
    {
      href: url,
      title: intl.formatMessage({ id: `common.switch-to-lang.${lang}` }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: label }),
    ),
  )
})

const CurrentLangLink = ({ lang, intl, label }) =>
  h(
    `a.LangLink.${lang}.current`,
    {
      href: '',
      title: intl.formatMessage({ id: 'fo.current-lang-link-title' }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: label }),
    ),
  )

const DisabledLangLink = ({ lang, intl, label }) =>
  h(
    `a.LangLink.${lang}.disabled`,
    {
      href: '',
      title: intl.formatMessage({ id: label }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: `common.lang-selector-label-html.${lang}` }),
    ),
  )
