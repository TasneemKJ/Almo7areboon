/* Offline support: remember what the game has loaded so a returning player can start without a connection. */
const CACHE = 'almo7areboon-runtime-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Pages: prefer the network so updates arrive, but fall back to the last copy offline.
    // Everything else: answer from the cache at once and refresh it in the background.
    const refresh = fetch(request).then(response => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone()).catch(() => {});
      return response;
    });
    if (request.mode === 'navigate') return refresh.catch(async () => (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./')) || Response.error());
    const cached = await cache.match(request);
    if (cached) { refresh.catch(() => {}); return cached; }
    return refresh;
  })());
});
