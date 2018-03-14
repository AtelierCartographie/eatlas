//@flow

import { getResourceIds } from './universal-utils'

export { getDefinition, parseRelated } from './universal-utils'

export const range = (start: number, end: number): Array<number> => {
  const result = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
}

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

export const parseRelated = string => {
  const match = string.match(/^\s*(.*?)\s*-\s*(.*?)\s*$/)
  const id = match && match[1]
  const text = match && match[2]
  return { id, text }
}
