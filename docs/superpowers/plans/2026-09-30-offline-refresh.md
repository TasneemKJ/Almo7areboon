# Offline cache refresh lifetime

IDEAL: identify unregistered background cache work; define complete refresh persistence without slowing cached responses; explore awaiting every response versus extending worker lifetime; act on registered background work; look back through deterministic event tests, native offline return and independent audit. 5 W's: returning players; refreshed offline assets; the existing service worker; after cached responses and on offline reload; reliable continuity.

Bounded design preserves network-first navigation, stale-while-revalidate assets, same-origin GET interception and the existing bundle limit. Register the entire network/cache-write/trim chain synchronously with FetchEvent.waitUntil; keep response delivery independent of cache latency. Handle background offline/quota failures quietly while preserving ordinary response/fallback failures. No combat or saved-profile changes.

Primary reference checked 2026-09-30: W3C Service Workers, https://www.w3.org/TR/service-workers/, event lifetime and waitUntil. The current implementation's respondWith only covers the returned response, not a background refresh after a cache hit or an unawaited cache.put.

1. Reproduce through the real worker script with deferred network/cache operations. Require cached response delivery before refresh, event lifetime through cache put and bundle trim, offline fallback, rejected cache writes, and interception boundaries.
2. Implement scoped worker change and verify all tests/build. Add required native Playwright production cases for online refresh followed by offline fetch/reload and resumed gameplay. Publish bounded diagnostic/screenshot evidence.
3. Independent whole-branch audit, fix supported defects, reconcile predecessors, merge after all required gates pass and verify deployment separately. A unit lifetime contract is not a claim about browser termination frequency or all-device offline support.

User authorized continuous autonomous design, implementation, test, PR, review and merge iterations; routine approval handoffs proceed within that scope.
