# Almo Home / short-result native QA

Local-only preparation for a disposable QA branch. The coordinator controls publication and run admission. No product edits, local browser launches, local socket attempts, manual workflow calls, deployments or network writes were performed in this preparation.

## Immutable identity

- Candidate: `7c5554e827c98107da1aaf0bb8d7f0f3bd74c9c1`
- Candidate tree: `e12c7d4e13378e5c41d7f1b23ff5f75b682680ef`
- Baseline: `d9dd1dcd1c5c4a4bb6cdd44641e73f8dd07f4003`
- Reviewed candidate source payload SHA-256: `dbbfc44ba95ad96d0460ae84c39593a73ba8b89752975106790ef032762e0570`
- On-push QA branch only: `qa/almo-simple-entry-20261005`
- Exactly two jobs, read-only token permissions, no artifact-upload quota dependency, no manual dispatch.

## Bounded jobs

1. `compare-390`: matched 390×844 empty-profile initial-load task. One untouched baseline initial-ready screenshot plus candidate Home and real short defeat result. The baseline predates Home and is labeled a dense initial screen, never misrepresented as an existing Home.
2. `small-320-rotate`: candidate 320×568 Home, Settings, real Play, one actual troop deployment, deliberate Settings → Retreat, short defeat result, then the same result at 844×390 and back. Three original PNGs: Home 320, result 320, rotated result 844. Additional native cases cover durable renderer-import failure/Reload and a separately seeded future-save temporary session; their full metadata is transported without extra screenshots.

Each case uses Chromium mobile/touch emulation, DPR 2, CPU throttle 4, English and normal motion. The runner serves that checkout's own immutable production build from a short-lived in-process HTTP server, under `flock /tmp/browser.lock`. Node 22 type stripping imports only native save helpers. It installs with `npm ci --ignore-scripts`, builds with `npm run build`, and installs Chromium through the existing Playwright package. Product `HEAD`, tracked-file cleanliness and tree are checked. Source-file, build-file, aggregate build and harness-file SHA-256 hashes are recorded.

## Native assertions

- Fresh first-play starts from `[null, null]` primary/backup storage in a new browser context. No food-level-20 or other prepared first-play fixture.
- Home waits for renderer readiness and removal of the world loader. Exactly Play/Continue plus Settings; at most two visible UI controls. Home does not start a battle. Because Home deliberately stops HUD updates, an absent/unchanged world phase is reported as a limited native observation; source tests establish the actual freeze.
- Real Tab reaches Settings with native visible focus, Enter opens it, native Close restores its opener. Home Settings does not offer Retreat before battle starts.
- Native Play starts the real running battle. One genuinely accepted unit deployment is checked in the actual save, then native Settings/Retreat produces a loss. This is a boundary probe, not a two-minute gameplay acceptance.
- Short result has exactly Retry, Details and Home. Every Home/result target must have a semantic name, ≥44 CSS-pixel target/effective bounds (0.5px tolerance), full viewport containment and five `elementFromPoint` hit samples. Ordinary Home/results must not require scrolling. Settings and the optional full receipt may scroll deliberately.
- Native keyboard activates Details. The original full receipt remains available and reports the one deployment. Back restores Details focus. Home preserves the settled loss, focuses Continue and retains save bytes; Continue reopens the same result without starting/rewarding a new battle.
- Native viewport rotation keeps the settled result and recomputes all target/overflow checks at 844×390 and after return.
- A separate decoder-valid saved profile tests exact built battlefield-chunk `route.abort('failed')`. After 5.5 real seconds, the toast has gone but the failure explanation and reachable Reload remain. The interception is removed, the actual Reload control is tapped and exact primary/backup bytes remain intact after recovery. Raw expected request/console errors are retained and classified only for the exact aborted asset; all unrelated errors still fail. Service workers are blocked at browser-context level to make this precise interception reliable; offline caching remains unverified.
- A separate future-version primary/default-backup fixture uses the real recovery → temporary-play path. Home, Settings, deployment, Retreat, Details, Home, an actual autosave interval and reload retain both original save byte strings. Import/Reset stay disabled. It is explicitly not the fresh-user flow.
- Every input/action records host UTC start/end times, browser event/performance timestamps, trusted native event metadata and before/after observations. No CSS injection, renderer substitution, fake simulation stepping, review hooks or clock override.

## Evidence transport and acceptance

Screenshots use `page.screenshot({scale:'css', fullPage:false})`. Original PNG bytes are never resized or recompressed. One emitter call preflights the entire job, including both revisions in `compare-390`, before emitting any image payload. It accepts at most three images and only the explicit 320→844 rotation. Hash, byte length, dimensions and provenance must match.

`SCENE_IMAGE_BEGIN`, `SCENE_IMAGE_DATA`, `SCENE_IMAGE_END`, complete manifests and a final transport terminator are emitted. Transport plus timestamp allowance stays strictly below 3.25 MiB; 512 KiB is reserved for setup/Actions logs. npm/build/browser-install logs are bounded separately. The downloaded raw job log must also be strictly below 3.75 MiB: `scripts/verify-job-log.py RAW_LOG ORIGINALS_DIRECTORY` rejects an over-budget or incomplete log, checks every original SHA/dimension and writes byte-identical originals. No truncation is accepted. Source manifests retain failed native status; extracting valid diagnostic pixels is not a passing test.

Remaining gates: authorized native GitHub execution, complete-log extraction/verification, review of every original screenshot and all failures. Dense main-play remains unaccepted. No full 120-second session, full native audio suite, physical touch/orientation/backgrounding, Safari, native device safe areas, offline cache, victory/expedition progression or comprehensive save-conflict acceptance is claimed here. The source's independently reviewed 1,077 tests/build are background, not a substitute for native execution.

## Offline checks performed

- `node --check` on all `.mjs` scripts
- `PRODUCT_ROOT=/…/game-checkouts/Almo7areboon node --experimental-strip-types --test scripts/harness-self-check.test.mjs`: 8 pure/static tests
- `python3 scripts/test-emitter.py`: 15 pure transport/complete-log tests
- Python compilation and parsed YAML validation

Synthetic PNGs exist only as disposable transport-test fixtures. No game screenshots have been generated during local preparation.
