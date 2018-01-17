import { addLocaleData } from 'react-intl'

import enData from 'react-intl/locale-data/en'
import frData from 'react-intl/locale-data/fr'

import en from './en.json'
import fr from './fr.json'

addLocaleData(enData)
addLocaleData(frData)

export { en, fr }
