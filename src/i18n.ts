import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/en.json';
import ar from './locales/ar/ar.json';
import zh from './locales/zh-CN/zh-CN.json'; // ✅ تمت إضافة الصينية

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      zh: { translation: zh }, // ✅ إضافة الصينية
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'zh'], // ✅ دعم الصينية
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
