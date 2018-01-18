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
