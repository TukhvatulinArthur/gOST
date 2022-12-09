const staticCacheName = "s-app-v1";
const assetUrls = ["index.html", "./js/index.min.js", "./css/index.min.css"];

self.addEventListener("install", async (e) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);
});
self.addEventListener("activate", async (e) => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.filter((name) => name !== staticCacheName).map((name) => caches.delete(name)));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(cacheFirst(e.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? (await fetch(request));
}
