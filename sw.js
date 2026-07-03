const CACHE_NAME = 'sg-site-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/logo.svg',
  '/manifest.json',
  '/icons/logo-192.png',
  '/icons/logo-512.png'
];

// Install - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch - cache-first for assets, network fallback
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        // Optional: cache fetched assets (limit to same-origin)
        if (req.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => {
        // fallback: for navigation, serve index.html
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
