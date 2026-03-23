const CACHE_NAME = 'prompter-v1';
const CACHE_URLS = [
  '/android_app/prompter/',
  '/android_app/prompter/index.html',
  '/android_app/prompter/manifest.json',
  '/android_app/prompter/sw.js',
  '/android_app/shared/icons/icon-192.png',
  '/android_app/shared/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
