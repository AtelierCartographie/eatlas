// @flow

declare type User = {
  id?: string,
  name: string,
  email: string,
  role: string,
}

declare type ResourceType = '' | 'article' | 'map' | 'sound' | 'image' | 'video'

declare type Resource = {
  id: string,
  type: ResourceType,
  name: string,
}
