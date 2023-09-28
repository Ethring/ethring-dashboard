/* eslint-disable no-console */

import { register } from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
    register(`${process.env.BASE_URL}service-worker.js`, {
        registered() {
            console.log('Service worker has been registered.');
        },
        error(error) {
            console.error('Error during service worker registration:', error);
        },
    });
}
