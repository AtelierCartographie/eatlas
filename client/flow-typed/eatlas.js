// @flow

// See https://github.com/facebook/flow/issues/961 for the sad state of DRY and enums with Flow

declare type Locale = 'fr' | 'en'

declare type UserRole = 'anonymous' | 'visitor' | 'admin'

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

declare type AppState = {
  locale: string,
  users: { loading: boolean, saving: boolean, list: User[] },
  resources: { loading: boolean, fetched: boolean, list: Resource[] },
  topics: { loading: boolean, list: Topic[] },
  user: { current: ?User, checkedServerLogin: boolean, verifying: boolean },
}

declare type UserNew = {
  name: string,
  email: string,
  role: UserRole,
}

declare type User = UserNew & { id: string }

declare type Topic = {
  id: number, // this id can't be totally arbitrary, docx rely on special numbers
  name: string,
}

declare type ResourceNew = {
  type: ResourceType,
  id: string,
  title: string,
  subtitle?: string, // only article, focus, map
  topic: string,
  language: string,
  description: string,
  copyright?: string, // only definition, map, image, video, sound
  mediaUrl?: string, // only video
}

declare type Definition = { dt: string, dd: string, resourceId?: ?string }

declare type Resource = ResourceNew & {
  file?: string,
  nodes?: any[],
  definitions?: Definition[],
  images?: {
    small: { '1x'?: ?string, '2x'?: ?string, '3x'?: ?string },
    medium: { '1x': ?string, '2x'?: ?string, '3x'?: ?string },
    large: { '1x'?: ?string, '2x'?: ?string, '3x'?: ?string },
  },
  author: string,
  updatedBy: string, // email
  createdAt: string, // Date (ISO 8601)
  updatedAt?: string, // Date (ISO 8601)
  publishedAt?: string, // Date (ISO 8601)
  status: ResourceStatus,
}

declare type GoogleDocBase = {
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

declare type GoogleDocPhoto = GoogleDocBase & {
  type: 'photo',
  //rotation: number,
  //rotationDegree: number,
}

declare type GoogleDocWord = GoogleDocBase & {
  type: 'document',
}

declare type GoogleDoc = GoogleDocPhoto | GoogleDocWord

declare type Upload = {
  mimeType: string,
  fileId: string,
  key: string,
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
