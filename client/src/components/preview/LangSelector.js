// @flow

const h = require('react-hyperscript')
const { injectIntl } = require('react-intl')
const Html = require('./Html')
const { LOCALES } = require('../../universal-utils')

module.exports = injectIntl(
  ({ options, intl, logoColor, shortLabel = false }) =>
    h(
      `.LangSelector${logoColor ? `.${logoColor}` : ''}${
        shortLabel ? '.short-label' : ''
      }`,
      Object.keys(LOCALES).map(lang =>
        h(LangLink, {
          intl,
          key: lang,
          lang,
          url: intl.urls[lang],
          shortLabel,
        }),
      ),
    ),
)

const LangLink = (module.exports.LangLink = ({
  intl,
  lang,
  url,
  shortLabel,
  label = shortLabel
    ? `common.summary-lang.${lang}`
    : `common.lang-selector-label-html.${lang}`,
}) => {
  if (intl.lang === lang) {
    return h(CurrentLangLink, { intl, lang, label })
  }

  if (!url) {
    return h(DisabledLangLink, { intl, lang, label })
  }

  return h(EnabledLangLink, { intl, lang, label, url })
})

const EnabledLangLink = ({ lang, intl, label, url }) =>
  h(
    `a.LangLink.${lang}.other`,
    {
      href: url,
      lang,
      title: intl.formatMessage({ id: `common.switch-to-lang.${lang}` }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: label }),
    ),
  )

const CurrentLangLink = ({ lang, intl, label }) =>
  h(
    `a.LangLink.${lang}.current`,
    {
      href: '#',
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
      href: '#',
      title: intl.formatMessage({ id: `common.none-lang-link-title.${lang}` }),
    },
    h(
      Html,
      { whitelist: 'all', noP: true, component: 'span' },
      intl.formatMessage({ id: label }),
    ),
  )
