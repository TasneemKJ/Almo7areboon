# Performance budgets

Targets for a mid-range phone (about 4x slower than a desktop CPU, 4G):

| Measure | Budget | Measured 2026-10-05 (headless Chromium, 4x CPU throttle, localhost) |
|---|---|---|
| Interactive (`#age-title` present) | at most 5 s | about 4.2-4.8 s at 320, 360, 390, 412 and 844 widths |
| Total shipped JavaScript, including Phaser and workers | at most 500 KiB (512,000 bytes), gzip level 9 | 466,797 bytes (455.9 KiB), local build on 2026-10-05 |
| Frame rate in battle | at least 30 fps | not yet measured |

Measured by touch-enabled Playwright with `Emulation.setCPUThrottlingRate` 4. The weekly full suite should record these numbers; frame-rate capture and lazy-loading Phaser (to show the shell before the 1.2 MB chunk) are open tasks in `TODO.md`. Hosted-browser numbers are not physical-device proof.

The JavaScript size policy is the same in all six game repositories; see
[javascript-budget.md](javascript-budget.md) for exact counting rules. The
production build enforces it. Size measurement is local and does not update or
re-certify the browser timings above. There is no separate engine allowance.
