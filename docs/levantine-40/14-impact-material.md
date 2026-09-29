# 14 — Material-specific impact choreography

Baseline: merged outpost-detail PR #11, main merge `1030937a4bd12eb303e1a492e127d5c267064397`.

## Design philosophy
This pass applies **temporal hierarchy**, **material response**, and **contact readability**. An impact should not be a generic spark regardless of era. It should read in three beats: contact, breakup, dissipation. Early materials shed dust and stone chips; bronze throws warm sparks; powder-era hits flash then smoke; modern steel mixes sparks with fragments; future weapons resolve as contained energy pulses.

The effect remains subordinate to the troop silhouette. All marks live in a small local envelope, heavy units increase visual mass rather than effect count, and no full-screen flash, bloom or camera-wide color wash is introduced.

## Implementation
- Added pure view model `src/view/impact-material.ts` with five presentation families: `earth`, `bronze`, `powder`, `steel`, `energy`.
- Each family generates bounded `flash`, `dust`, `spark`, `shard`, `smoke` or `pulse` marks from normalized contact progress.
- Player/enemy geometry mirrors exactly; only future-energy hue uses faction color.
- Reduced-motion mode returns one static contact composition independent of progress.
- Battlefield queues view-only impact cues. Melee/direct hits appear at the resolved hit point; ranged impact choreography begins only after the visible projectile reaches its target.
- Existing base-damage choreography remains separate and unchanged. Damage, targeting, hit timing, collisions, economy and saves remain simulation-owned.

## Verification
Seven focused regressions were observed RED before implementation and GREEN afterward. Fresh full suite: **236/236 passing**. TypeScript/Vite production build passed; the existing Phaser vendor-size warning remains.

The change touches renderer/view code only. Browser/mobile/Safari, subjective effect timing and measured frame rate remain unverified under the existing browser restriction. This is refinement 14/40. No scheduler.
