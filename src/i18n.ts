import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/en.json';
import ar from './locales/ar/ar.json';

i18n
  .use(LanguageDetector) // ✅ للكشف عن اللغة تلقائيًا من localStorage أو المتصفح
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'], // ✅ أولاً من localStorage ثم من المتصفح
      caches: ['localStorage'],
    },
  });

export default i18n;
