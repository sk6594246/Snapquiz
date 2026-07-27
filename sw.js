// Define Cache Name and Version
const CACHE_NAME = 'snapquiz-pwa-v1';

// Files to pre-cache for offline availability
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://via.placeholder.com/192',
  'https://via.placeholder.com/512'
];

/**
 * 1. INSTALL EVENT
 * Triggered when the service worker is first registered.
 * Downloads and caches core application files.
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing New Version...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Instantly activate new service worker
  );
});

/**
 * 2. ACTIVATE EVENT
 * Triggered after installation.
 * Cleans up outdated cache stores from previous app versions.
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

/**
 * 3. FETCH EVENT
 * Intercepts network requests made by the app.
 */
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass cache for Gemini API requests to ensure fresh quiz generation
  if (requestUrl.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-First strategy for local static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return cached asset if found
      }
      
      // Fall back to fetching from network if not in cache
      return fetch(event.request).then((networkResponse) => {
        // Cache newly fetched valid resources dynamically
        if (
          !networkResponse || 
          networkResponse.status !== 200 || 
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Optional: Return custom offline fallback if network fails
      console.log('[Service Worker] Fetch failed; returning offline page if available.');
    })
  );
});
