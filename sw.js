const CACHE_NAME = 'fari-ai-cache-v1';

// On install, skip waiting and immediately take control.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// On activation, clean up old caches to save space.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// On fetch, use a "stale-while-revalidate" strategy.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Fetch from the network in the background to update the cache.
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If we get a valid response, update the cache.
          // This will cache both same-origin and cross-origin (CDN) resources.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          // The network request failed, probably because the user is offline.
          // The request will fail if there's no cached response either.
          console.warn('Network request failed:', error);
        });

        // Return the cached response immediately if it exists, otherwise wait for the network.
        // This makes the app feel instant on subsequent visits.
        return cachedResponse || fetchPromise;
      });
    })
  );
});