/* Offline support: remember what the game has loaded so a returning player can start without a connection. */
const CACHE = 'almo7areboon-runtime-v1';
// Vite replaces this list with the shipped artwork and generated worker files.
const INSTALL_ASSETS = [];
const SCOPE = new URL(self.registration.scope);
// Bound old bundles without evicting scripts/styles still required by the cached page.
const KEEP_BUNDLES = 6;
const inScope = url => {
  if (url.origin !== self.location.origin) return false;
  return url.pathname.startsWith(SCOPE.pathname);
};
const shellURLs = html => [...html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|webmanifest|svg|png))"/g)]
  .map(match => new URL(match[1], SCOPE)).filter(inScope).map(url => url.href);
const immutableBundle = url => /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(new URL(url).pathname);

async function trimBundles(cache) {
  const bundles = (await cache.keys()).filter(request => {
    const url = new URL(request.url);
    return inScope(url) && /\/assets\/[^/]+\.(js|css)$/.test(url.pathname);
  });
  if (bundles.length <= KEEP_BUNDLES) return;
  const page = await cache.match(SCOPE.href);
  const required = new Set(page ? shellURLs(await page.text()) : []);
  const stale = bundles.filter(request => !required.has(request.url));
  for (const request of stale.slice(0, bundles.length - KEEP_BUNDLES)) await cache.delete(request);
}

async function cacheShell(cache, page, reuseBundles = true) {
  const html = await page.clone().text();
  const assets = await Promise.all(shellURLs(html).map(async url => {
    let response;
    if (reuseBundles && immutableBundle(url)) {
      try { response = await cache.match(url); } catch { /* Fetch below if storage is unavailable. */ }
    }
    response ||= await fetch(url, { cache: 'reload' });
    if (!response.ok) throw new Error(`Unable to cache ${url}`);
    // Drain now: an installing worker may throttle later requests until earlier bodies finish.
    // Keep the original response for cache storage, including its URL and headers.
    await response.clone().arrayBuffer();
    return [url, response];
  }));
  // Commit the page last: a failed update leaves the previous complete shell bootable.
  for (const [url, response] of assets) await cache.put(url, response);
  await cache.put(SCOPE.href, page);
}

// Fetch the page and the scripts and styles it names now, so even the very first visit can be replayed offline.
async function precache() {
  const cache = await caches.open(CACHE);
  const page = await fetch(SCOPE.href, { cache: 'reload' });
  if (!page.ok) throw new Error(`Unable to cache ${SCOPE.href}`);
  // First-page resources can load before clients.claim(), bypassing fetch events.
  // Complete these dependencies before committing the entry page or activating.
  await Promise.all(INSTALL_ASSETS.map(async path => {
    const url = new URL(path, SCOPE);
    if (!inScope(url)) throw new Error(`Out-of-scope installation asset ${url}`);
    const response = await fetch(url.href, { cache: 'reload' });
    if (!response.ok) throw new Error(`Unable to cache ${url}`);
    await response.clone().arrayBuffer();
    await cache.put(url.href, response);
  }));
  await cacheShell(cache, page, false);
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  // This build reuses v1. Other apps and newer builds own their own caches; do not delete them.
  event.waitUntil(self.clients.claim());
});

async function match(cache, key) {
  try { return cache ? await cache.match(key) : undefined; }
  catch { return undefined; }
}

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !inScope(url)) return;
  const navigation = request.mode === 'navigate';
  // Campaign/query links and index.html must update the same offline entry page.
  url.search = '';
  if (navigation && url.pathname === `${SCOPE.pathname}index.html`) url.pathname = SCOPE.pathname;
  const key = navigation ? url.href : request;
  const entryNavigation = navigation && url.href === SCOPE.href;
  // CacheStorage is optional: an unavailable cache must not block a healthy network request.
  const opened = Promise.resolve().then(() => caches.open(CACHE)).catch(() => null);
  // Hashed modules cannot change at this URL. A cached module needs no refresh;
  // offline retries can otherwise compete with first-return module loading.
  if (!navigation && immutableBundle(url.href)) {
    const result = opened.then(async cache => {
      const cached = await match(cache, key);
      return cached ? { response: cached, cache: null } : { response: await fetch(request), cache };
    });
    event.waitUntil(result.then(async ({ response, cache }) => {
      if (!cache || !response.ok || response.type !== 'basic') return;
      await cache.put(key, response.clone());
      await trimBundles(cache);
    }).catch(() => {}));
    event.respondWith(result.then(({ response }) => response));
    return;
  }
  const refresh = Promise.resolve().then(() => fetch(request));
  const fallback = async () => {
    const cache = await opened;
    return (await match(cache, key)) || (await match(cache, SCOPE.href));
  };
  // Keep revalidation alive without making response delivery wait for cache writes or cleanup.
  event.waitUntil(refresh.then(async response => {
    if (response.ok && response.type === 'basic') {
      // Clone before awaiting storage; the browser may already be consuming the network body.
      const copy = response.clone(), cache = await opened;
      if (!cache) return;
      if (entryNavigation) await cacheShell(cache, copy);
      else await cache.put(key, copy);
      await trimBundles(cache);
    }
  }).catch(() => {}));
  event.respondWith((async () => {
    if (navigation) {
      try {
        const response = await refresh;
        return response.status >= 500 ? (await fallback()) || response : response;
      } catch { return (await fallback()) || Response.error(); }
    }
    const cached = await match(await opened, key);
    return cached || refresh;
  })());
});
