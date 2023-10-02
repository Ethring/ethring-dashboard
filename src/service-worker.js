const DOMEN_LIST = ['https://assets.coingecko.com', 'https://cryptologos.cc/logos'];

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
    const { request } = event;
    const checkImageDomen = DOMEN_LIST.some((item) => request.url.startsWith(item));

    if (checkImageDomen) {
        event.respondWith(
            cacheFirst({
                request: request,
                fallbackUrl: request.url,
            })
        );
    }
});
