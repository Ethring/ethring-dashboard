import { createApp } from 'vue';
import VueClickAway from 'vue3-click-away';
import { vue3Debounce } from 'vue-debounce';

import * as Sentry from '@sentry/vue';
import { BrowserTracing } from '@sentry/browser';

import App from './App.vue';

import Router from './routes';

import store from './store';

import '@/assets/styles/index.scss';

import { i18n } from '@/shared/i18n';

import { initWeb3 } from '@/compositions/useWeb3Onboard';

import { getChainList } from '@/api/networks';

getChainList().then((chains) => {
    initWeb3(chains);

    const app = createApp(App)
        .directive('debounce', vue3Debounce({ lock: true }))
        .use(store)
        .use(VueClickAway)
        .use(Router)
        .use(i18n);

    if (process.env.VUE_APP_SENTRY_DSN) {
        Sentry.init({
            app,
            dsn: process.env.VUE_APP_SENTRY_DSN,
            tunnel: new URL(process.env.VUE_APP_SENTRY_DSN).origin + '/tunnel',
            release: process.env.VUE_APP_RELEASE,
            environment: process.env.NODE_ENV,
            integrations: [
                new BrowserTracing({
                    routingInstrumentation: Sentry.vueRouterInstrumentation(Router),
                }),
            ],
            tracesSampleRate: 0.5,
        });
    }

    app.mount('#app');
});
