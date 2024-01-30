/* eslint-disable no-console */
import { register } from 'register-service-worker';

if (import.meta.env.MODE === 'production') {
    register(`${import.meta.env.BASE_URL}service-worker.js`, {
        registered() {
            console.log('Service worker has been registered.');
        },

        error(error) {
            console.error('Error during service worker registration:', error);
        },
    });
}
