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
