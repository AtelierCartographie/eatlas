// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import { fr as messages } from './i18n'

import './index.css'
import App from './components/App'
import store from './store'
import { checkSession } from './api'
import { userLogin, notifyCheckedUserSession } from './actions'

// Immediately ask to server for user's session
checkSession()
  .then(user => store.dispatch(userLogin(user)))
  .catch(() => {}) // error = not logged in, whatever
  // finally
  .then(() => store.dispatch(notifyCheckedUserSession()))

ReactDOM.render(
  <Provider store={store}>
    <IntlProvider locale="en" messages={messages}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IntlProvider>
  </Provider>,
  // $FlowFixMe
  document.getElementById('root'),
)
