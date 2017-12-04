// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './components/App'
import store from './store'
import { checkSession } from './api'
import { userLogin, notifyCheckedUserSession } from './actions'

// Immediately ask to server for user's session
checkSession()
  .then(({ name, email, role }) => store.dispatch(userLogin({ name, email, role })))
  .catch(() => {}) // error = not logged in, whatever
  // finally
  .then(() => store.dispatch(notifyCheckedUserSession()))

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  // $FlowFixMe
  document.getElementById('root'),
)
