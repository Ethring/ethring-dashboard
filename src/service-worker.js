// Disable logging in production
self.__WB_DISABLE_DEV_LOGS = process.env.NODE_ENV === 'production';

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
