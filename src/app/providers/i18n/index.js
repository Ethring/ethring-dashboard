import { createI18n } from 'vue-i18n';
import en from './translations/en.json';

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: localStorage.getItem('lang') || 'en',
    fallbackLocale: ['en'],
    messages: {
        en,
    },
});

export default i18n;
