//@flow

const FAKE_USER: User = {
  id: '1',
  name: 'Fake User',
  email: 'fake@fake',
  role: 'admin',
}

const FAKE_RESOURCE: Resource = {
  id: '0V00',
  type: 'video',
  file: 'fake-video.avi',
  description: 'some fake video',
  language: 'en',
  author: 'me@myself',
  createdAt: new Date().toISOString(),
  status: 'submitted',
  title: 'some video',
  topic: 'ze topic',
}

const FAKE_TOPICS: Topic[] = [
  {
    id: '1',
    order: 1,
    name: 'Présentation',
  },
  {
    id: '2',
    order: 2,
    name: 'Contrastes et inégalités',
  },
  {
    id: '3',
    order: 3,
    name: 'Mobilités',
  },
  {
    id: '4',
    order: 4,
    name: 'Stratégies des acteurs transnationaux',
  },
  {
    id: '5',
    order: 5,
    name: '(in)sécurités/paix',
  },
  {
    id: '6',
    order: 6,
    name: 'Vulnérabilités et défis',
  },
]

export const addResourceFromGoogleDrive = (
  body: ResourceNew & {
    uploads: Upload[],
    accessToken: string,
  },
): Promise<Resource> =>
  query({
    url: '/resources',
    method: 'POST',
    body,
    fake: () => FAKE_RESOURCE,
  })

export const parseArticleDoc = (body: {
  uploads: Upload[],
  accessToken: string,
}): Promise<any> =>
  query({
    url: '/parse/article',
    method: 'POST',
    body,
  })

export const updateResource = (id: string, body: Object): Promise<Resource> =>
  query({
    method: 'POST',
    url: `/resources/${id}`,
    body,
    fake: () => Object.assign(FAKE_USER, body),
  })

export const getResource = (id: string): Promise<Resource> =>
  query({
    url: `/resources/${id}`,
    fake: () => FAKE_RESOURCE,
  })

export const getResources = (): Promise<Resource[]> =>
  query({
    url: `/resources`,
    fake: () => [FAKE_RESOURCE],
  })

export const deleteResource = (id: string): Promise<null> =>
  query({
    method: 'DELETE',
    url: `/resources/${id}`,
    fake: () => null,
  })

// Check if user has an active session on server
export const checkSession = (): Promise<User> =>
  query({
    url: '/session',
    fake: () => FAKE_USER,
  })

// Try to login onto server once we got a Google Auth Token
export const login = (token: string): Promise<User> =>
  query({
    method: 'POST',
    url: '/login',
    body: { token },
    fake: () => FAKE_USER,
  })

export const getUser = (id: string): Promise<User> =>
  query({
    url: `/users/${id}`,
    fake: () => FAKE_USER,
  })

export const getUsers = (): Promise<User[]> =>
  query({
    url: '/users',
    fake: () => [FAKE_USER],
  })

export const updateUser = (id: string, body: Object): Promise<User> =>
  query({
    method: 'POST',
    url: `/users/${id}`,
    body,
    fake: () => Object.assign(FAKE_USER, body),
  })

export const addUser = (body: UserNew): Promise<User> =>
  query({
    method: 'POST',
    url: '/users',
    body,
    fake: () => FAKE_USER,
  })

export const deleteUser = (id: string): Promise<null> =>
  query({
    method: 'DELETE',
    url: `/users/${id}`,
    fake: () => null,
  })

export const getTopic = (id: string): Promise<Topic> =>
  query({
    url: `/topics/${id}`,
  })

export const getTopics = (): Promise<Topic[]> =>
  query({
    url: '/topics',
    fake: () => FAKE_TOPICS,
    forceFake: true,
  })

export const updateTopic = (id: string, body: Object): Promise<Topic> =>
  query({
    method: 'POST',
    url: `/topics/${id}`,
    body,
    fake: () => Object.assign(FAKE_USER, body),
  })

export const addTopic = (body: TopicNew): Promise<Topic> =>
  query({
    method: 'POST',
    url: '/topics',
    body,
  })

export const deleteTopic = (id: string): Promise<null> =>
  query({
    method: 'DELETE',
    url: `/topics/${id}`,
    fake: () => null,
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
const query = <T>(
  {
    method = 'GET',
    url,
    body,
    delay = 0,
    fake = () => null,
    forceFake,
  }: {
    method?: string,
    url: string,
    body?: Object,
    delay?: number,
    fake?: Function,
    forceFake?: boolean,
  } = {},
): Promise<T> => {
  if (process.env.REACT_APP_MOCK_API === 'yes' || forceFake) {
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
  const fullUrl = (process.env.REACT_APP_API_SERVER || '') + url

  // $FlowFixMe: I can't make him understand, fuck it
  return fetch(fullUrl, options)
    .then(res => (res.status === 204 ? {} : res.json()))
    .then(data => {
      if (data.error) {
        let err = new Error(data.message || data.error)
        // $FlowFixMe: enhancing Error object
        err.code = data.error
        // $FlowFixMe: enhancing Error object
        err.status = data.statusCode
        throw err
      }
      return data
    })
  // TODO catch authentication errors and force login
}
