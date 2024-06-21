import { init, replayIntegration, browserTracingIntegration, captureException } from '@sentry/vue';

import { ignorePatterns } from './tx-ignore.json';

export default function useSentry(app, router) {
    if (!process.env.SENTRY_DSN) return;

    return init({
        app,
        dsn: process.env.SENTRY_DSN,
        tunnel: new URL(process.env.SENTRY_DSN).origin + '/tunnel',
        release: process.env.RELEASE,
        environment: process.env.NODE_ENV,

        // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: 0.1,

        // If the entire session is not sampled, use the below sample rate to sample
        // sessions when an error occurs.
        replaysOnErrorSampleRate: 1.0,

        integrations: [browserTracingIntegration({ router }), replayIntegration()],
        tracesSampleRate: 0.5,

        ignoreErrors: ignorePatterns,
    });
}

export const captureTransactionException = ({ error, ...args }) => {
    if (!process.env.SENTRY_DSN) return;

    const ignoreRegex = new RegExp(ignorePatterns.join('|'), 'i');

    if (ignoreRegex.test(error)) return;

    const { id = null, module = null, tx = {} } = args || {};

    let txString = '';

    try {
        txString = JSON.stringify(tx);
    } catch (e) {
        console.error('Sentry -> captureTransactionException -> Unable to stringify tx:', e, tx);
        txString = tx;
    }

    const errorInstance = new Error(error);

    errorInstance.name = `Sign and send transaction error | ${module} | TX-ID: ${id}`;

    return captureException(errorInstance, {
        tags: {
            module,
        },
        extra: {
            ...args,
            tx: txString,
        },
    });
};

export const captureSentryException = (error) => {
    if (!process.env.SENTRY_DSN) return;

    return captureException(error);
};
