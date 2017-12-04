const FAKE_USER = {
  name: 'Fake User',
  email: 'fake@fake',
  role: 'admin',
}

// Check if user has an active session on server
export const checkSession = () => query({
  url: '/session',
  fake: () => FAKE_USER,
})

// Try to login onto server once we got a Google Auth Token
export const login = token => query({
  method: 'POST',
  url: '/login',
  body: { token },
  fake: () => FAKE_USER,
})

// Return a fake async response
const fakeResponse = (fake, delay) => new Promise((resolve, reject) => setTimeout(() => {
  const result = fake()
  if (result instanceof Error) {
    reject(result)
  } else {
    resolve(result)
  }
}, delay))

// Get from server or return fake, depends on environment configuration
const query = ({ method = 'GET', url, body, delay = 0, fake = () => null } = {}) => {
  if (process.env.REACT_APP_MOCK_API) {
    return fakeResponse(fake, delay)
  } else {
    const headers = method === 'post'
      ? { 'Content-Type': 'application/json; charset=UTF-8' }
      : {}
    const options = {
      credentials: 'include',
      method,
      headers,
      body,
    }
    const fullUrl = process.env.REACT_APP_API_SERVER + url
    return fetch(fullUrl, options).then(response => response.json())
    // TODO catch authentication errors and force login
  }
}
