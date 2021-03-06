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
  description_fr: 'une fausse vidéo',
  description_en: 'some fake video',
  language: 'en',
  author: 'me@myself',
  createdAt: new Date().toISOString(),
  status: 'submitted',
  title: 'Le grand saut',
  topic: '1',
  updatedBy: 'no-one',
  mediaUrl: 'https://vimeo.com/256032055',
  transcript: '',
}

const FAKE_TOPICS: Topic[] = [
  {
    id: 1,
    name: 'Présentation',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
  {
    id: 2,
    name: 'Contrastes et inégalités',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
  {
    id: 3,
    name: 'Mobilités',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
  {
    id: 4,
    name: 'Stratégies des acteurs transnationaux',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
  {
    id: 5,
    name: '(in)sécurités/paix',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
  {
    id: 6,
    name: 'Vulnérabilités et défis',
    resourceId: '',
    description_fr: '',
    description_en: ''
  },
]

export const parseArticleDoc = (body: {
  uploads: Upload[],
  accessToken: string,
}): Promise<any> =>
  query({
    url: '/parse/article',
    method: 'POST',
    body,
  })

export const parseFocusDoc = (body: {
  uploads: Upload[],
  accessToken: string,
}): Promise<any> =>
  query({
    url: '/parse/focus',
    method: 'POST',
    body,
  })

export const parseLexiconDoc = (body: {
  uploads: Upload[],
  accessToken: string,
}): Promise<any> =>
  query({
    url: '/parse/lexicon',
    method: 'POST',
    body,
  })

export const addResourceFromGoogleDrive = (
  body: ResourceNew & {
    uploads: Upload[],
    accessToken: string,
  },
): Promise<Resource> =>
  query({
    url: '/resources/google-drive',
    method: 'POST',
    body,
    fake: () => FAKE_RESOURCE,
  })

export const addResource = (body: ResourceNew): Promise<Resource> =>
  query({
    url: '/resources',
    method: 'POST',
    body,
    fake: () => FAKE_RESOURCE,
  })

export const updateResource = (id: string, body: Object): Promise<Resource> =>
  query({
    method: 'PUT',
    url: `/resources/${id}`,
    body,
    fake: () => Object.assign(FAKE_RESOURCE, body),
  })

export const getResource = (id: string): Promise<Resource> =>
  query({
    url: `/resources/${id}`,
    fake: () => FAKE_RESOURCE,
  })

export const getResourceUrls = (id: string): Promise<string[]> =>
  query({
    url: `/resources/${id}/urls`,
    fake: () => [],
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
    method: 'PUT',
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
  })

export const updateTopic = (id: string, body: Topic): Promise<Topic> =>
  query({
    method: 'PUT',
    url: `/topics/${id}`,
    body,
  })

export const addTopic = (body: Topic): Promise<Topic> =>
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
const query = <T>({
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
} = {}): Promise<T> => {
  if (process.env.REACT_APP_MOCK_API === 'yes' || forceFake) {
    return fakeResponse(fake, delay)
  }

  const fullUrl = (process.env.REACT_APP_API_SERVER || '') + url

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        // $FlowFixMe
        if (xhr.status === 204) return resolve({})
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.error || String(xhr.status)[0] !== '2') {
            let err = new Error(data.message || data.error)
            // $FlowFixMe: enhancing Error object
            err.code = data.error
            // $FlowFixMe: enhancing Error object
            err.status = data.statusCode
            throw err
          }
          resolve(data)
        } catch (err) {
          reject(err)
        }
      }
    }
    xhr.open(method, fullUrl, true)
    if (body) {
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
      xhr.send(JSON.stringify(body))
    } else {
      xhr.send()
    }
  })
  // TODO catch authentication errors and force login
}
