const CACHE_NAME = 'groomai-v11';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — cache assets, skip waiting immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST always (so updates show immediately)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.hostname.includes('googleapis.com')||
     url.hostname.includes('gstatic.com')||
     url.hostname.includes('generativelanguage')){
    event.respondWith(fetch(event.request));
    return;
  }
  // Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if(res&&res.status===200){
          const clone=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(event.request,clone));
        }
        return res;
      })
      .catch(()=>caches.match(event.request))
  );
});
