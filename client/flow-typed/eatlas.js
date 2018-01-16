// @flow

declare type UserNew = {
  name: string,
  email: string,
  role: string,
}

declare type User = UserNew & { id: string }

declare type ResourceType = '' | 'article' | 'map' | 'sound' | 'image' | 'video'

declare type Resource = {
  id: string,
  type: ResourceType,
  name: string,
}

declare type UploadDoc = {
  id: string,
  name: string,
}

// WIP, see https://developers.google.com/api-client-library/javascript/reference/referencedocs
declare type GoogleApi = {
  client: {
    init: ({
      apiKey: string,
      clientId: string,
      discoveryDocs: Array<string>,
      scope: Array<string>,
    }) => Promise<any>,
  },
  auth2: {
    getAuthInstance: () => {
      signIn: () => Promise<any>,
    },
  },
  auth: {
    getToken: () => {
      access_token: string,
    },
  },
}
