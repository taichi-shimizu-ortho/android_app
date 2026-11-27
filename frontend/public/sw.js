const CACHE_NAME = 'app-v16';
const urlsToCache = [
  '/android_app/',
  '/android_app/index.html',
  '/android_app/home/',
  '/android_app/msc/',
  '/android_app/ihc/',
  '/android_app/ish/',
  '/android_app/manifest_home.json',
  '/android_app/manifest_msc.json',
  '/android_app/manifest_ihc.json',
  '/android_app/manifest_ish.json',
  '/android_app/icons/home/icon-192.png',
  '/android_app/icons/msc/icon-192.png',
  '/android_app/icons/ihc/icon-192.png',
  '/android_app/icons/ish/icon-192.png',
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

  const url = new URL(event.request.url);
  // 廃止した PWA の URL は、旧版のキャッシュやホームへのフォールバックを使わない。
  if (url.origin === self.location.origin &&
      /^\/android_app\/(?:prompter(?:\/|$)|icons\/prompter(?:\/|$)|manifest_prompter\.json$)/.test(url.pathname)) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-cache' })));
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
  // HTML は毎回サーバーに確認する（ブラウザの HTTP キャッシュで古い版が出ないように）。
  // /assets/ はファイル名にハッシュが付くので HTTP キャッシュのままでよい。
  const revalidate = url.origin === self.location.origin &&
    !url.pathname.startsWith('/android_app/assets/');
  const request = revalidate ? new Request(event.request, { cache: 'no-cache' }) : event.request;
  event.respondWith(
    fetch(request).then(response => {
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
        // fallback to the app's own index.html if navigating
        if (event.request.mode === 'navigate') {
          const dir = new URL(event.request.url).pathname.replace(/[^/]*$/, '');
          return caches.match(dir).then(res => res || caches.match('/android_app/home/'));
        }
      });
    })
  );
});
