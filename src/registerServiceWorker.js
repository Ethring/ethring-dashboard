/* eslint-disable no-console */
import { register } from 'register-service-worker';

if (process.env.MODE === 'production') {
    console.info('Service worker is enabled in production mode.');

    register(`${process.env.BASE_URL}service-worker.js`, {
        registered() {
            console.log('Service worker has been registered.');
        },

        error(error) {
            console.error('Error during service worker registration:', error);
        },
    });
}
