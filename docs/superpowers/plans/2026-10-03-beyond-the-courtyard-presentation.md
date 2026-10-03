# Beyond the Courtyard — Mobile Presentation and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Expose the full expansion through a compact mobile UI, Phaser presentation, manifest-driven art/audio packs, offline preparation and release evidence without increasing permanent combat controls.

**Architecture:** DOM owns campaign/loadout/accessibility UI; Phaser renders battlefield-only presentation from domain projections. Asset manifests have stable keys/hashes and pack readiness is explicit. The UI never grants rewards or computes damage.

**Tech Stack:** TypeScript, DOM/CSS, Phaser, Vite, Playwright, service worker.

**Spec:** approved Beyond the Courtyard design/content/acceptance docs.

## Global Constraints
- No new permanent bottom tab; expansion enters from existing battle/story surface.
- Combat remains three troop controls + three skill slots + existing pause/speed/objective feedback.
- Normal controls >=44×44 CSS px; 320px portrait and 200% text must remain usable.
- Six region packs, eight tribe kits/24 role art sets; do not multiply art by six eras.
- Load active region + active rosters, not every expansion pack.
- Missing pack leaves current game playable; no service-worker reset/unregister recovery shortcut.
- Deep Verify game remains manual-only.

## Review Focus
- Targeting remains usable after orientation change/background/ownership loss.
- Pack hash/image failure cannot mark a region offline-ready.
- Result/recruitment sheet cannot obscure Continue or double-grant.
- WebKit painted-frame regression must compare composed screenshot and post-render capture.
- Original mode remains visually and behaviorally unchanged after returning from expansion.

---

### Task 1: Campaign selector and mission briefing
**Files:** Create `src/ui/frontier-campaign.ts`, `src/ui/frontier.css`; modify existing battle/story entry coordinator; browser test `scripts/review-frontier-campaign.mjs`.
**Interfaces:** Consumes read-only region/mission projection and emits select/continue actions.
- [ ] Write browser assertions for entry invitation, six regions, locked explanations, next mission, optional expansion and Original tale return at 320/390/430px.
- [ ] Verify red; implement DOM UI; verify green.
- [ ] Commit `feat: add mobile frontier campaign selector`.

### Task 2: Compact loadout sheet
**Files:** Create `src/ui/frontier-loadout.ts`; extend `frontier.css`; browser/unit tests.
**Interfaces:** Consumes unlocked tribe/skills/relic projection; emits one validated loadout change before Start.
- [ ] Test one tribe, exactly three distinct skills, one/none relic, locked feedback, persistence, keyboard/focus and 200% text.
- [ ] Verify red; implement; verify green.
- [ ] Commit `feat: add frontier loadout sheet`.

### Task 3: Three-slot skills and accessible targeting
**Files:** Modify battle HUD coordinator; create `src/ui/frontier-targeting.ts`; test `scripts/review-frontier-targeting.mjs`.
**Interfaces:** Emits typed slot/band/cancel actions; consumes targeting projection.
- [ ] Test touch Near/Middle/Far, canvas tap mapping, Q/W/E, Escape, cancellation on menu/orientation/background/owner loss and no charge consumption on cancel.
- [ ] Verify red; implement; verify green.
- [ ] Commit `feat: add mobile frontier skill targeting`.

### Task 4: Region/tribe visual manifest and Phaser adapters
**Files:** Create `src/view/frontier-manifest.ts`, `src/view/frontier-battlefield.ts`; add approved generated/packed assets under `public/art/frontier/`; tests `tests/frontier-assets.test.ts`.
**Interfaces:** Stable manifest keys/hashes; renderer consumes prepared battle/events only.
- [ ] Validate six region packs, 24 role art sets, boss silhouettes, dimensions/hash references and no missing assets.
- [ ] Generate/pack required original-style art, then verify manifest.
- [ ] Render all eight tribes/24 variants and six bosses from domain identity; no gameplay calculations.
- [ ] Commit `feat: add frontier region and tribe presentation`.

### Task 5: Result/recruitment/relic presentation
**Files:** Create `src/ui/frontier-result.ts`; browser tests.
**Interfaces:** Consumes immutable receipt; emits Continue/Replay/Try-loadout only.
- [ ] Test first/repeat clear, recruitment, skill/relic grant, optional trophy, reload restore, focus return and duplicate-tap resistance.
- [ ] Verify red; implement; verify green.
- [ ] Commit `feat: add frontier reward presentation`.

### Task 6: Offline pack preparation and cache safety
**Files:** Extend `public/sw.js`; create `src/game/frontier/packs.ts`; modify settings/offline UI; test `scripts/review-frontier-offline.mjs`.
**Interfaces:** `prepareRegionPack(regionId)`, `packStatus(regionId)`; validated complete-pack manifest.
- [ ] Test fresh cache, partial download, missing image, bad hash, 503, cache failure, worker overlap, old-pack fallback and actual offline start/deploy/cast/retreat.
- [ ] Verify red; implement complete-pack commit semantics; verify green Chromium and supported WebKit checks.
- [ ] Commit `feat: add offline frontier region packs`.

### Task 7: Mobile/accessibility/render acceptance
**Files:** Create `scripts/review-frontier-mobile.mjs`, `scripts/review-frontier-render.mjs`; no production changes unless a reproduced defect is fixed with regression.
**Interfaces:** Evidence reports keyed to acceptance IDs.
- [ ] Exercise every mission briefing/objective/outcome; all 24 variants; all 12 skills; all grant surfaces at 320×568, 360×640, 390×844, 430×932, 320×480 and 844×390 risk samples.
- [ ] Verify 44px targets, no overflow/overlap, focus trap/return, non-color boss tells, reduced motion and 200% text.
- [ ] Run 20-cycle Chromium/WebKit painted-frame recovery with post-render + composed screenshots and manually inspect baseline/mid/final evidence.
- [ ] Record WebKit offline errors as unverified rather than passes.
- [ ] Commit `test: add frontier mobile release evidence`.

### Task 8: Integration and release gate
**Files:** Update README/content docs only for actually shipped behavior; produce QA artifact/report.
**Interfaces:** Integrates Campaign/Combat/Presentation plans.
- [ ] Run `npm test` and `npm run build`.
- [ ] Run 864-combination balance matrix and browser acceptance suites deliberately.
- [ ] Verify v1-v6 migration/import/export, original campaign regression, offline recovery and first-clear idempotency.
- [ ] Measure compressed bootstrap/selected-region transfer and decoded texture estimates against spec budgets.
- [ ] Record physical-device/performance gaps if hardware is unavailable; do not infer them from CI.
- [ ] Raise implementation PR with completed scope, exact evidence, failures/accepted risks and no “bug-free” claim without proof.
- [ ] Commit `docs: record Beyond the Courtyard release evidence`.
