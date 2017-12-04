import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './components/App'
import store from './store'
import { checkSession } from './api'

// Immediately ask to server for user's session
// FIXME API call
checkSession()
  .then(token => store.dispatch({ type: 'login', payload: token }))
  .catch(() => {}) // error = not logged in, whatever
  // finally
  .then(() => store.dispatch({ type: 'ui', payload: { checkedServerLogin: true } }))

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
)
