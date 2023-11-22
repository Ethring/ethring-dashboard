import * as Sentry from '@sentry/vue';
import { BrowserTracing } from '@sentry/browser';

import { ignorePatterns } from './tx-ignore.json';

export default function useSentry(app, Router) {
    if (!process.env.VUE_APP_SENTRY_DSN) {
        return;
    }

    return Sentry.init({
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

export const captureTransactionException = ({ error, ...args }) => {
    if (!process.env.VUE_APP_SENTRY_DSN) {
        return;
    }

    const ignoreRegex = new RegExp(ignorePatterns.join('|'), 'i');

    if (ignoreRegex.test(error)) {
        return;
    }

    return Sentry.captureException(error, {
        extra: {
            ...args,
        },
    });
};
