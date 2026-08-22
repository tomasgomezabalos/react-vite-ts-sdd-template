import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  defaultLanguage,
  defaultNamespace,
  resources,
} from './resources'

await i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  defaultNS: defaultNamespace,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export { i18n }
