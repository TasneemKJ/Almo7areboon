# Shared JavaScript budget

## One ceiling for all six games

The production output's **emitted JavaScript files plus executable inline
`<script>` blocks must total at most 500 KiB (512,000 bytes), using gzip
compression at level 9**. This definition and value are identical in
Al-bayyara, Al-ejar, Al-nafetha, Almo7areboon, Bait-Al-dumiah and souq-al-layl.
There is no separate allowance or exclusion for an engine.

`scripts/check-size.mjs` measures the completed output and exits nonzero when
it exceeds the limit, is missing, or contains no JavaScript. The production
packaging command runs it automatically. To inspect an existing output, run:

```sh
node scripts/check-size.mjs
node scripts/check-size.mjs path/to/output
```

## Exactly what is measured

- Every `.js`, `.mjs` and `.cjs` file anywhere in the output directory is gzipped
  independently at level 9; the compressed byte lengths are added.
- Engines and other dependencies count in full, as do lazy, debug, worker and
  service-worker files. Identical files at different paths count separately.
- Executable inline `<script>` bodies in each HTML file are joined in document
  order with one newline and gzipped together. Each HTML file counts separately.
  This lets the single-file Souq distribution use the same JavaScript metric.
- JSON data blocks and import maps are not executable JavaScript. HTML markup,
  CSS, source maps, images, fonts and audio are outside this particular metric.
- Inline event-handler attributes (such as `onclick`) and `javascript:` URLs
  are outside this static metric. The checker does not account for every
  executable byte in HTML. This scope is identical in all six repositories.
- These files and script blocks count across the **whole output directory**,
  including both entry and deferred code. A second chunk does not remove bytes
  from the budget. The checker does not fetch remote resources or claim to
  measure server compression, cache behavior or network transfer bytes.

The checker prints each measured file and the exact total, using KiB = 1,024
bytes. Run it on freshly packaged output; stale files in the directory still
count. Keep the checker and its behavioral contracts in sync across the repos.

## Why 500 KiB

This is a pragmatic ceiling for the existing mix of native-canvas, Phaser and
Three.js games, approved on 2026-10-05. The largest observed distribution was
about 456 KiB, including about 323 KiB of Phaser. A 500 KiB cap leaves roughly
44 KiB of headroom in that game while retaining its engine in the same limit.
The smaller games do not receive an extra engine allowance. The ceiling is a
regression guard, not a target to grow toward; budget increases require a
conscious cross-repository decision instead of an automatic ratchet.

This change **does not make any game load faster**, and being below the cap
is not mobile-performance certification. Initial-load requests, JavaScript
parse/execute cost, first usable frame, input responsiveness and frame rate
still need measured mobile checks, alongside the other asset types.
[web.dev's performance-budget guidance](https://web.dev/articles/performance-budgets-101)
recommends counting frameworks and combining size limits with user-centric
timings. Its much smaller critical-path example is a different metric, not a
claim that 500 KiB is a universally fast mobile download.

## Regression coverage

The ordinary test command runs real temporary build fixtures through the CLI.
The contract covers the common cap, aggregate chunks, engines/workers, duplicate
paths, mixed and inline-only HTML, inert blocks, source-map exclusion, empty or
missing output, and production-command wiring. No browser, network access,
engine runtime, or additional dependency is needed for these budget checks.
