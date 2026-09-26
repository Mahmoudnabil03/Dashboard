/* SocialHub service worker: network-first navigations, cache-first hashed static. */
const STATIC_CACHE = "socialhub-static-v1";
const SAME_ORIGIN_STATIC = /\/static\//;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }
  if (SAME_ORIGIN_STATIC.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          if (hit) return hit;
          return fetch(request).then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          });
        })
      )
    );
  }
});
