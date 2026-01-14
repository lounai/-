// service-worker.js
// service-worker.js
const CACHE_NAME = 'employee-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/favicon.svg',
  '/icons/icon-96x96.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // 移除 '/icons/icon-72x72.png' 因為它不存在
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached');
        return self.skipWaiting();
      })
  );
});

// 啟用 Service Worker
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
});

// 攔截請求 - 更穩定的版本
self.addEventListener('fetch', event => {
  // 跳過 Supabase 和外部資源請求
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('cdnjs.cloudflare.com') ||
      event.request.url.includes('unpkg.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 返回快取或網路請求
        return response || fetch(event.request);
      })
      .catch(() => {
        // 如果都失敗，返回離線頁面
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
