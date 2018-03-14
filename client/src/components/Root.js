// @flow

import React, { Fragment } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import * as messages from '../i18n'
import { connect } from 'react-redux'

import ScrollTop from './ScrollTop'
import App from './App'

type Props = {
  locale: Locale,
}

const Root = ({ locale }: Props) => {
  const lang = locale.substring(0, 2)

  return (
    <IntlProvider
      key={locale}
      locale={locale}
      messages={messages[lang]}
      textComponent={Fragment}>
      <BrowserRouter basename={process.env.REACT_APP_ADMIN_BASENAME || '/'}>
        <ScrollTop>
          <App />
        </ScrollTop>
      </BrowserRouter>
    </IntlProvider>
  )
}

export default connect(({ locale }: AppState) => ({ locale }))(Root)
