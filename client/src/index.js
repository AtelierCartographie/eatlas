import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './components/App'
import store from './store'

// Immediately ask to server for user's session
// FIXME API call
setTimeout(() => {
  store.dispatch({ type: 'login', payload: 'fake user' })
}, 250)

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
)
