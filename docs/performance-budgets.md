# Performance budgets

Targets for a mid-range phone (about 4x slower than a desktop CPU, 4G):

| Measure | Budget | Measured 2026-10-05 (headless Chromium, 4x CPU throttle, localhost) |
|---|---|---|
| Interactive (`#age-title` present) | at most 5 s | about 4.2-4.8 s at 320, 360, 390, 412 and 844 widths |
| Phaser chunk | at most 1.3 MB minified (about 340 kB gzip) | 1.21 MB (332 kB gzip) |
| App chunk | at most 400 kB minified | 356 kB |
| Frame rate in battle | at least 30 fps | not yet measured |

Measured by touch-enabled Playwright with `Emulation.setCPUThrottlingRate` 4. The weekly full suite should record these numbers; frame-rate capture and lazy-loading Phaser (to show the shell before the 1.2 MB chunk) are open tasks in `TODO.md`. Hosted-browser numbers are not physical-device proof.
