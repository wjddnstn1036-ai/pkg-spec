const CACHE = 'pkg-spec-v5-2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 신고 전송(API 호출)은 캐시 없이 항상 네트워크로
  if (url.origin !== location.origin) {
    return; // 외부 요청은 브라우저 기본 동작
  }
  // 페이지(HTML)는 네트워크 우선 → 새 버전 자동 반영, 오프라인이면 캐시
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // 나머지(아이콘 등)는 캐시 우선
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
