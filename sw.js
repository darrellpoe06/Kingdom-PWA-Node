const CACHE_NAME = 'kingdom-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json'
];

// Install Event: Caching the core Kingdom parameters
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache for Kingdom Node');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Event: Serving cached assets to prevent system drag
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached file if found, otherwise fetch from the grid
        return response || fetch(event.request);
      })
  );
});
