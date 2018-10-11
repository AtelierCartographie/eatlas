import browserLocale from 'browser-locale'
import { LOCALES } from './constants'

export default () => {
  let locale

  // Look for current URI
  const searchParams = new URLSearchParams(document.location.search)
  locale = searchParams.get('locale')
  if (locale && window.localStorage) {
    // Just set from URI: persist to localStorage
    saveLocale(locale)
    searchParams.delete('locale')
    document.location.search = searchParams.toString()
  }

  // Look into localStorage
  if (!locale && window.localStorage) {
    locale = window.localStorage.getItem('locale', locale)
  }

  // Fallback: use browser's current locale
  if (!locale) {
    locale = browserLocale().substring(0, 2)
  }

  if (LOCALES.indexOf(locale) === -1) {
    locale = LOCALES[0]
  }

  return locale
}

export const saveLocale = locale => {
  window.localStorage.setItem('locale', locale)
}
