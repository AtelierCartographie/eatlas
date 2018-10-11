import React from 'react'
import Html from './preview/Html'
import { injectIntl } from 'react-intl'

export default injectIntl(({ intl, lang }) => (
  <Html whitelist="all" noP={true} component="span" title={lang}>
    {intl.formatMessage({ id: `common.flag-html.${lang}` })}{' '}
  </Html>
))
