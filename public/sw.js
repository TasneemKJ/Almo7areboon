/* Offline support: remember what the game has loaded so a returning player can start without a connection. */
const CACHE = 'almo7areboon-runtime-v1';
// Each deploy adds new hashed bundles; keep only the newest few so the cache cannot grow without limit.
const KEEP_BUNDLES = 6;

async function trimBundles(cache) {
  const bundles = (await cache.keys()).filter(request => /\/assets\/[^/]+\.(js|css)$/.test(new URL(request.url).pathname));
  for (const stale of bundles.slice(0, Math.max(0, bundles.length - KEEP_BUNDLES))) await cache.delete(stale);
}

// Fetch the page and the scripts and styles it names now, so even the very first visit can be replayed offline.
async function precache() {
  const cache = await caches.open(CACHE);
  const page = await fetch('./', { cache: 'reload' });
  if (!page.ok) return;
  const html = await page.clone().text();
  await cache.put('./', page);
  const urls = [...html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|webmanifest|svg|png))"/g)].map(match => new URL(match[1], self.registration.scope).href);
  await Promise.all(urls.map(url => cache.add(url).catch(() => {})));
}

self.addEventListener('install', event => {
  event.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

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
      if (response.ok && response.type === 'basic') cache.put(request, response.clone()).then(() => trimBundles(cache)).catch(() => {});
      return response;
    });
    if (request.mode === 'navigate') return refresh.catch(async () => (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./')) || Response.error());
    const cached = await cache.match(request);
    if (cached) { refresh.catch(() => {}); return cached; }
    return refresh;
  })());
});
