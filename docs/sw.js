const CACHE_NAME = 'app-v8';
const urlsToCache = [
  '/android_app/',
  '/android_app/index.html',
  '/android_app/manifest_msc.json',
  '/android_app/manifest_ihc.json',
  '/android_app/manifest_ish.json',
  '/android_app/icons/msc/icon-192.png',
  '/android_app/icons/ihc/icon-192.png',
  '/android_app/icons/ish/icon-192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Network first for Supabase
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network first for everything else (to ensure getting the latest Vite assets),
  // fallback to cache if offline.
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      if (event.request.method === 'GET' && !event.request.url.includes('chrome-extension')) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache).catch(() => {});
        });
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) return response;
        // fallback to index.html if navigating
        if (event.request.mode === 'navigate') {
          return caches.match('/android_app/index.html');
        }
      });
    })
  );
});
