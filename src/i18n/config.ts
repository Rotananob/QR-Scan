import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import km from './locales/km.json';

const savedLang = localStorage.getItem('qr-scan-lang') || 'km';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    lng: savedLang,
    fallbackLng: 'km',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
