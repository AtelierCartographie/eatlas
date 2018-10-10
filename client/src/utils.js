//@flow

import { TYPE_FROM_LETTER } from './constants'
import { getResourceIds } from './universal-utils'

export { getDefinition, parseRelated } from './universal-utils'

// https://gist.github.com/kottenator/9d936eb3e4e3c3e02598
export const paginationItems = (
  current: number,
  last: number,
  delta: number = 2,
): Array<?number> => {
  const left = current - delta
  const right = current + delta + 1

  const pages = []
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      pages.push(i)
    }
  }

  const result = []
  let l = null
  for (let i of pages) {
    if (l) {
      if (i - l === 2) {
        result.push(l + 1)
      } else if (i - l !== 1) {
        result.push(null)
      }
    }
    result.push(i)
    l = i
  }

  return result
}

export const updateQueryString = (qs: string, updates: Object): string => {
  // Modify query string manually (I didn't want to inject another dependency as we do it only here)
  let updated = qs

  Object.keys(updates).forEach(param => {
    const value = updates[param]
    const match = updated.match(new RegExp(`(&|\\?)${param}=.*?(&|\\?|$)`))
    if (match) {
      // delete or update: remove value
      // $FlowFixMe: noooo it's not just a string[]
      const index: number = match.index
      updated =
        updated.substring(0, index + 1) +
        updated.substring(index + match[0].length)
      // Special case: if it was the latest element, we should return empty string in the end
      if (updated === '?') {
        updated = ''
      }
    }
    if (value !== null) {
      // insert or update: reappend value
      const last = updated[updated.length - 1]
      const prefix = last === '?' || last === '&' ? '' : last === '' ? '?' : '&'
      updated += `${prefix}${param}=${String(value)}`
    }
  })

  return updated
}

// TODO Flow: any = react-router's location
export const updateLocation = (
  location: any,
  updates: { pathname?: string, search?: Object },
): any => {
  const updated = Object.assign({}, location)
  if ('search' in updates) {
    // $FlowFixMe: I've just tested prop exists dude…
    const qs: Object = updates.search
    updated.search = updateQueryString(updated.search, qs)
  }
  if ('pathname' in updates) {
    updated.pathname = updates.pathname
  }
  return updated
}

export const canUnpublish = (
  resource: Resource,
  resources: Resource[],
): boolean => {
  if (resource.status !== 'published') {
    return true
  }
  // Check if resource is used in a published article or focus
  const publishedArticles = resources.filter(
    r =>
      (r.type === 'article' || r.type === 'focus') && r.status === 'published',
  )
  return !publishedArticles.some(
    // Check if resource is one of the mandatory linked resources of article
    article => getResourceIds(article, true).indexOf(resource.id) !== -1,
  )
}

export const guessResourceType = (resource: Resource): ?ResourceType => {
  if (!resource.id) return null

  const match = resource.id.match(/^\d+([CPVASF])/i)
  if (!match) return null

  return TYPE_FROM_LETTER[match[1]]
}

export const guessResourceLanguage = (resource: Resource): ?Locale => {
  if (!resource.id) return null

  // TODO build from constants LEXICON_ID_PREFIX and LOCALES
  const match = resource.id.match(/^(?:[0-9CPVASF]|LEXIC)+-(EN|FR)$/i)
  if (!match) return null

  return match[1].toLowerCase()
}
