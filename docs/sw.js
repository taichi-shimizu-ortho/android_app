const CACHE_NAME = 'protocol-v6';
const urlsToCache = [
  '/android_app/protocol/',
  '/android_app/protocol/index.html',
  '/android_app/protocol/main.js',
  '/android_app/protocol/manifest.json',
  '/android_app/protocol/icons/icon-192.png',
  '/android_app/protocol/icons/icon-512.png'
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
  // chrome-extension リクエストはスキップ
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Supabaseへのリクエストはネットワーク優先
  if (event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // その他のリクエストはキャッシュ優先
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(response => {
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
      });
    }).catch(() => {
      return caches.match('/android_app/protocol/index.html');
    })
  );
});
