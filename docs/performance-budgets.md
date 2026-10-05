# Performance budgets

Targets for a mid-range phone (about 4x slower than a desktop CPU, 4G):

| Measure | Budget | Measured 2026-10-05 (headless Chromium, 4x CPU throttle, localhost) |
|---|---|---|
| Interactive (`#age-title` present) | at most 5 s | 4.1-4.3 s with Phaser lazy-loaded (was 4.2-4.8 s); battlefield canvas at 4.5-4.7 s |
| Phaser chunk | at most 1.3 MB minified (about 340 kB gzip) | 1.21 MB (332 kB gzip) |
| App chunk | at most 400 kB minified | 233 kB (battlefield chunk 127 kB, loaded after the shell) |
| Frame rate | at least 30 fps | **not met in this harness**: 8-14 fps on the result screen under 4x throttle in headless Chromium with software WebGL; needs a GPU-backed or physical-device measurement before tuning |

Measured by `npm run review:mobile-touch` (touch-enabled Playwright with `Emulation.setCPUThrottlingRate` 4). The weekly full suite should record these numbers; frame-rate capture and lazy-loading Phaser (to show the shell before the 1.2 MB chunk) are open tasks in `TODO.md`. Hosted-browser numbers are not physical-device proof.
