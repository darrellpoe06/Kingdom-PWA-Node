const CACHE_NAME = 'shalom-edge-cache-v1';
const CORE_ASSETS = [
    './index.html',
    './app.js',
    './llm-worker.js',
    './manifest.json'
];

// Install Event: Pre-cache local core architecture
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Architecture Node] Pre-caching core artifacts...');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// Activate Event: Purge legacy caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Architecture Node] Purging legacy cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event: Stale-While-Revalidate for CDNs, Cache-First for local assets
self.addEventListener('fetch', (event) => {
    // Intercept CDN and ML model requests (HuggingFace, jsDelivr, etc.)
    if (event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('huggingface.co')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Return instantly from cache
                }
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // Standard asset routing
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
