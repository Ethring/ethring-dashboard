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

            // This sets the sample rate to be 10%. You may want this to be 100% while
            // in development and sample at a lower rate in production
            replaysSessionSampleRate: 0.1,

            // If the entire session is not sampled, use the below sample rate to sample
            // sessions when an error occurs.
            replaysOnErrorSampleRate: 1.0,

            integrations: [
                new BrowserTracing({
                    routingInstrumentation: Sentry.vueRouterInstrumentation(Router),
                }),
                new Sentry.Replay(),
            ],
            tracesSampleRate: 0.5,
        });
    }

    app.mount('#app');
});
