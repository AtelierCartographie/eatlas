const FAKE_USER = {
  id: '1',
  name: 'Fake User',
  email: 'fake@fake',
  role: 'admin',
}

const FAKE_RESOURCE = {
  id: 1,
  type: 'video',
  name: 'Fake video',
  nodes: [],
}

export const addResourceFromGoogleDrive = (body: {
  type: string,
  name: string,
  fileId: string,
  accessToken: string,
}) =>
  query({
    url: '/resources/google-drive',
    method: 'POST',
    body,
    fake: () => ({ id: FAKE_RESOURCE.id }),
  })

export const getResource = id =>
  query({
    url: `/resources/${id}`,
    fake: () => FAKE_RESOURCE,
  })

export const getResources = () =>
  query({
    url: `/resources`,
    fake: () => [FAKE_RESOURCE],
  })

// Check if user has an active session on server
export const checkSession = () =>
  query({
    url: '/session',
    fake: () => FAKE_USER,
  })

// Try to login onto server once we got a Google Auth Token
export const login = token =>
  query({
    method: 'POST',
    url: '/login',
    body: { token },
    fake: () => FAKE_USER,
  })

export const getUser = id =>
  query({
    url: `/users/${id}`,
    fake: () => FAKE_USER,
  })

export const getUsers = () =>
  query({
    url: '/users',
    fake: () => [FAKE_USER],
  })

export const updateUser = (id, body) =>
  query({
    method: 'POST',
    url: `/users/${id}`,
    body,
    fake: () => Object.assign(FAKE_USER, body),
  })

export const addUser = body =>
  query({
    method: 'POST',
    url: '/users',
    body,
    fake: () => FAKE_USER,
  })

export const deleteUser = id =>
  query({
    method: 'DELETE',
    url: `/users/${id}`,
  })

// Return a fake async response
const fakeResponse = (fake, delay) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      const result = fake()
      if (result instanceof Error) {
        reject(result)
      } else {
        resolve(result)
      }
    }, delay),
  )

// Get from server or return fake, depends on environment configuration
const query = (
  { method = 'GET', url, body, delay = 0, fake = () => null } = {},
) => {
  if (process.env.REACT_APP_MOCK_API === 'yes') {
    return fakeResponse(fake, delay)
  }

  const headers = body
    ? { 'Content-Type': 'application/json; charset=UTF-8' }
    : {}
  const options = {
    credentials: 'include',
    method,
    headers,
    body: body && JSON.stringify(body),
  }
  const fullUrl = process.env.REACT_APP_API_SERVER + url

  return fetch(fullUrl, options)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        let err = new Error(data.message || data.error)
        err.code = data.error
        err.status = data.statusCode
        throw err
      }
      return data
    })
  // TODO catch authentication errors and force login
}
