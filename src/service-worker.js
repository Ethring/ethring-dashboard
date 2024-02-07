// Disable logging in production
self.__WB_DISABLE_DEV_LOGS = process.env.NODE_ENV === 'production';

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

const DOMAIN_LIST = ['https://assets.coingecko.com', 'https://cryptologos.cc/logos'];

const putInCache = async (request, response) => {
    const cache = await caches.open('external-image-cache');
    await cache.put(request, response);
};

const cacheFirst = async ({ request, fallbackUrl }) => {
    const responseFromCache = await caches.match(request);

    if (responseFromCache) {
        return responseFromCache;
    }

    try {
        const responseFromNetwork = await fetch(request);

        putInCache(request, responseFromNetwork.clone());

        return responseFromNetwork;
    } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl);

        if (fallbackResponse) {
            return fallbackResponse;
        }

        return new Response('Network error happened', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
};

self.addEventListener('fetch', (event) => {
    const { request = {} } = event || {};
    const { url } = request;

    const checkImageDomain = DOMAIN_LIST.some((item) => url.startsWith(item));

    if (!checkImageDomain) {
        return;
    }

    const paramsForCache = {
        request,
        fallbackUrl: url,
    };

    event.respondWith(cacheFirst(paramsForCache));
});
