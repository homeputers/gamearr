import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import enNav from '../locales/en/nav.json';
import enSettings from '../locales/en/settings.json';
import esCommon from '../locales/es/common.json';
import esNav from '../locales/es/nav.json';
import esSettings from '../locales/es/settings.json';

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    settings: enSettings,
  },
  es: {
    common: esCommon,
    nav: esNav,
    settings: esSettings,
  },
};

const storedLng = typeof window !== 'undefined' ? localStorage.getItem('lang') : undefined;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLng || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    ns: ['common', 'nav', 'settings'],
    defaultNS: 'common',
  });

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem('lang', lng);
  });
}

export default i18n;
