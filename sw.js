/* Built by prepare-pages-pwa.mjs. Edit the script, not out/sw.js. */
const CACHE_PREFIX = "identity-navigator-pages-";
const CACHE_NAME = CACHE_PREFIX + "197dbc6a14d5bcd5";
const APP_SHELL = "/index.html";
const PRECACHE_URLS = [
  "/",
  "/__next.__PAGE__.txt",
  "/__next._full.txt",
  "/__next._head.txt",
  "/__next._index.txt",
  "/__next._tree.txt",
  "/_next/static/3Rn9ZSIKD7gmMTS952Oec/_buildManifest.js",
  "/_next/static/3Rn9ZSIKD7gmMTS952Oec/_clientMiddlewareManifest.js",
  "/_next/static/3Rn9ZSIKD7gmMTS952Oec/_ssgManifest.js",
  "/_next/static/chunks/03~yq9q893hmn.js",
  "/_next/static/chunks/07lhk_q6pmm3r.js",
  "/_next/static/chunks/0dbhjjzl8qfwv.js",
  "/_next/static/chunks/0df_h782vnlbz.js",
  "/_next/static/chunks/0ht900cau6_ur.js",
  "/_next/static/chunks/0qffl5w7_9w~q.js",
  "/_next/static/chunks/0t2z5hkh7v~~b.js",
  "/_next/static/chunks/0ti3i370p9v8f.js",
  "/_next/static/chunks/0tuhh.o4mae2_.css",
  "/_next/static/chunks/turbopack-0cek.dh0dqtgy.js",
  "/_not-found/__next._full.txt",
  "/_not-found/__next._head.txt",
  "/_not-found/__next._index.txt",
  "/_not-found/__next._not-found.__PAGE__.txt",
  "/_not-found/__next._not-found.txt",
  "/_not-found/__next._tree.txt",
  "/_not-found/index.html",
  "/_not-found/index.txt",
  "/404.html",
  "/404/index.html",
  "/forms/oregon/2026-10-24-checked/adult-name-sex-change-packet.pdf",
  "/forms/oregon/fee-waiver/2026-10-24-checked/fee-deferral-waiver-packet.pdf",
  "/icon.svg",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/index.html",
  "/index.txt",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ?? caches.match(APP_SHELL);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(async (cached) => {
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
