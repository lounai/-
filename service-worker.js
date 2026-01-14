// service-worker.js
const CACHE_NAME = 'employee-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css', 
  '/app.js',
  '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        // 改用逐一加入，避免 addAll 失敗
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.warn(`Could not cache ${url}:`, error);
              });
          })
        );
      })
      .then(() => {
        console.log('All resources cached');
      })
      .catch(error => {
        console.error('Cache failed:', error);
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
