# Performance budgets

Targets for a mid-range phone (about 4x slower than a desktop CPU, 4G):

| Measure | Budget | Measured 2026-10-05 (headless Chromium, 4x CPU throttle, localhost) |
|---|---|---|
| Interactive (`#age-title` present) | at most 5 s | 4.1-4.3 s with Phaser lazy-loaded (was 4.2-4.8 s); battlefield canvas at 4.5-4.7 s |
| Total shipped JavaScript, including Phaser, lazy chunks and workers | at most 500 KiB (512,000 bytes), gzip level 9 | 468,105 bytes (457.1 KiB), reconciled local build on 2026-10-05 |
| Phaser contribution | included in the total budget above | 1.21 MB (332 kB gzip), historical main measurement |
| App / battlefield split | included in the total budget above | 233 kB (battlefield chunk 127 kB, loaded after the shell) |
| Frame rate | at least 30 fps | **not met in this harness**: 8-14 fps on the result screen under 4x throttle in headless Chromium with software WebGL; needs a GPU-backed or physical-device measurement before tuning |

Measured by `npm run review:mobile-touch` (touch-enabled Playwright with `Emulation.setCPUThrottlingRate` 4). The weekly full suite should record these numbers; GPU-backed or physical-device frame-rate validation remains open in `TODO.md`. Phaser is now lazy-loaded after the shell. Hosted-browser numbers are not physical-device proof.

The JavaScript size policy is the same in all six game repositories; see
[javascript-budget.md](javascript-budget.md) for exact counting rules. The
production build enforces it. Size measurement is local and does not update or
re-certify the browser timings above. There is no separate engine allowance.
