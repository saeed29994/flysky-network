import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/en.json';
import fr from './locales/fr/fr.json';
import ar from './locales/ar/ar.json';
import zh from './locales/zh-CN/zh-CN.json';
import tr from './locales/tr/tr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
      zh: { translation: zh },
      tr: { translation: tr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar', 'zh', 'tr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
