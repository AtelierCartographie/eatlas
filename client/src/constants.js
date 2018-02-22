//@flow

// See https://github.com/facebook/flow/issues/961 for the sad state of DRY and enums with Flow

export const LOCALES: Locale[] = ['fr', 'en']

export const ROLES: UserRole[] = ['visitor', 'admin']

export const RESOURCE_TYPES: ResourceType[] = [
  'article',
  'definition',
  'focus',
  'map',
  'sound',
  'image',
  'video',
]

export const TYPE_FROM_LETTER: { [string]: ResourceType } = {
  C: 'map',
  P: 'image',
  V: 'video',
  A: 'article',
  S: 'sound',
  F: 'focus',
}

export const RESOURCE_STATUSES: ResourceStatus[] = [
  'submitted',
  'validated',
  'published',
  'deleted',
]

export const STATUS_STYLE: { [ResourceStatus]: string } = {
  submitted: 'warning',
  validated: 'info',
  published: 'success',
  deleted: 'danger',
}

export const MIME_TYPES: { [ResourceType]: string[] } = {
  article: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.document',
  ],
  map: ['image/svg+xml'],
  image: ['image/jpeg', 'image/png', 'image/gif'],
  sound: ['audio/mpeg', 'audio/mp3'],
  video: ['video/x-msvideo', 'video/mpeg'],
}

export const LEXICON_ID: string = 'LEXIC'

export const DEFAULT_PAGINATION_COUNT =
  Number(process.env.REACT_APP_PAGINATION_COUNT) || 10

export const PAGINATION_COUNTS = [5, 10, 15, 20, 50, 100]
