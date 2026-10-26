const CACHE_NAME = 'story-bible-pwa-v6';
const ASSETS = [
  './',
  './index.html',
  './스토리_성경통독.html',
  './bible_story_data.js',
  './story_bible_manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-First 전략: 인터넷이 연결되어 있으면 항상 최신 수정본을 먼저 받아오고, 오프라인일 때만 캐시를 사용
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // 대용량 성경 데이터(bible_story_data.js)는 빠르게 캐시에서 주되 백그라운드 갱신, HTML 문서는 무조건 최신 네트워크 우선!
  const url = new URL(event.request.url);
  const isBibleData = url.pathname.endsWith('bible_story_data.js');

  if (isBibleData) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  } else {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
});
