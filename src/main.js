import { createApp } from 'vue';
import VueClickAway from 'vue3-click-away';
import { vue3Debounce } from 'vue-debounce';

import App from './App.vue';

import Router from './routes';

import store from './store';

import '@/assets/styles/index.scss';

import { i18n } from '@/shared/i18n';

createApp(App)
    .directive('debounce', vue3Debounce({ lock: true }))
    .use(store)
    .use(VueClickAway)
    .use(Router)
    .use(i18n)
    .mount('#app');
