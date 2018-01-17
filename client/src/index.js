// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import './index.css'
import Root from './components/Root'
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
    <Root />
  </Provider>,
  // $FlowFixMe
  document.getElementById('root'),
)
