// @flow

declare type UserNew = {
  name: string,
  email: string,
  role: string,
}

declare type User = UserNew & { id: string }

declare type ResourceType = 'article' | 'map' | 'sound' | 'image' | 'video'

declare type Resource = {
  id: string,
  type: ResourceType,
  name: string,
}

declare type UploadDocBase = {
  id: string,
  serviceId: string, // 'docs', 'doc'?
  mimeType: string,
  name: string,
  description: string,
  type: string,
  lastEditedUtc: number,
  iconUrl: string, // e.g. 'https://drive-thirdparty.googleusercontent.com/16/type/image/png',
  url: string,
  embedUrl: string,
  sizeBytes: number,
  parentId?: string,
  isShared?: boolean,
}

declare type UploadDocPhoto = UploadDocBase & {
  type: 'photo',
  rotation: number,
  rotationDegree: number,
}

declare type UploadDocWord = UploadDocBase & {
  type: 'document',
}

declare type UploadDoc = UploadDocPhoto | UploadDocWord

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
