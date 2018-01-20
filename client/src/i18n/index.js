import { addLocaleData } from 'react-intl'
import timeago from 'timeago.js'

import enData from 'react-intl/locale-data/en'
import frData from 'react-intl/locale-data/fr'

import enTime from 'timeago.js/locales/en'
import frTime from 'timeago.js/locales/fr'

import en from './en.json'
import fr from './fr.json'

addLocaleData(enData)
addLocaleData(frData)

timeago.register('en', enTime)
timeago.register('fr', frTime)

export { en, fr }
