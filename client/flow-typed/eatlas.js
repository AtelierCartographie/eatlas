// @flow

declare type Locale = 'fr' | 'en'

declare type UserNew = {
  name: string,
  email: string,
  role: string,
}

declare type User = UserNew & { id: string }

declare type Topic = {
  name: string,
}

declare type ResourceType =
  | 'article'
  | 'definition'
  | 'focus'
  | 'map'
  | 'sound'
  | 'image'
  | 'video'

declare type ResourceStatus =
  | 'submitted'
  | 'validated'
  | 'published'
  | 'deleted'

declare type ResourceNew = {
  type: ResourceType,
  id: string,
  title: string,
  subtitle?: string, // only article, focus, map
  topic: string,
  language: string,
  description: string,
  copyright?: string, // only definition, map, image, video, sound
}

declare type Resource = ResourceNew & {
  file?: string,
  nodes?: any[],
  images?: {
    small: { '1x'?: string, '2x'?: string, '3x'?: string },
    medium: { '1x': string, '2x'?: string, '3x'?: string },
    large: { '1x'?: string, '2x'?: string, '3x'?: string },
  },
  author: string,
  createdAt: number, // timestamp
  updatedAt?: number, // timestamp
  publishedAt?: number, // timestamp
  status: ResourceStatus,
}

declare type UploadDocBase = {
  id: string,
  //serviceId: string, // 'docs', 'doc'?
  mimeType: string,
  name: string,
  //description: string,
  type: string,
  //lastEditedUtc: number,
  //iconUrl: string, // e.g. 'https://drive-thirdparty.googleusercontent.com/16/type/image/png',
  //url: string,
  //embedUrl: string,
  //sizeBytes: number,
  //parentId?: string,
  //isShared?: boolean,
}

declare type UploadDocPhoto = UploadDocBase & {
  type: 'photo',
  //rotation: number,
  //rotationDegree: number,
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
