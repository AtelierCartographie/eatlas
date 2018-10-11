// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')

module.exports = injectIntl(({ options, intl }) =>
  h('.LangSelector', [
    h(LangLink, { intl, lang: 'fr', url: intl.urls.fr }),
    h(LangLink, { intl, lang: 'en', url: intl.urls.en }),
  ]),
)

const LangLink = ({ intl, lang, url }) => {
  if (intl.lang === lang) {
    return h(CurrentLangLink, { intl, lang })
  }

  if (!url) {
    return h(DisabledLangLink, { intl, lang })
  }

  return h(
    `a.${lang}.other`,
    {
      href: url,
      title: intl.formatMessage({ id: `common.switch-to-lang.${lang}` }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: `common.lang-selector-label-html.${lang}` }),
    ),
  )
}

const CurrentLangLink = ({ lang, intl }) =>
  h(
    `a.${lang}.current`,
    {
      href: '',
      title: intl.formatMessage({ id: 'fo.current-lang-link-title' }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: `common.lang-selector-label-html.${lang}` }),
    ),
  )

const DisabledLangLink = ({ lang, intl }) =>
  h(
    `a.${lang}.disabled`,
    {
      href: '',
      title: intl.formatMessage({ id: `common.none-lang-link-title.${lang}` }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: `common.lang-selector-label-html.${lang}` }),
    ),
  )
