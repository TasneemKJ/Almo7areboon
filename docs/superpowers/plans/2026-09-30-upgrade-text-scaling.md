# Upgrade Text Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the two upgrade labels/prices enlarge through 200% while keeping purchases and lower-HUD keyboard focus readable and usable.

**Architecture:** Preserve native controls and the two-cell upgrade grid; intrinsic wrapping handles pressure inside each cell. Relative sizes apply only to upgrade label/price text, with inset focus on upgrade/nav buttons and a bounded real-browser regression probe.

**Tech Stack:** Existing CSS, TypeScript app, Playwright Chromium CI, Node assertions; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-30-upgrade-text-scaling.md`.

## Global Constraints

- Root reviews these documents before implementation and prepares an isolated branch after current releases. This documentation task authorizes no local browser run, app edit, or commit.
- Preserve two equal upgrade cells, action order, accessible names, prices, native button identity, current art, 44px targets, and `.world` ≥200px. No game/save/economy changes.
- Convert only 11px/10px upgrade labels to `.6875rem`/`.625rem` and 12px prices to `.75rem`; use unitless label line-height 1.1. No fixed root, text clamp, truncation, arbitrary word split, or viewport-budget reduction.
- Focus applies only to `.buy-button` and `.nav-item`: 3px inset outline with offset -3px, visible in forced colours. Existing focus/isolation logic stays intact.
- Root-size emulation is labelled; one actual browser default-font case verifies a 1rem sentinel. Unsupported native preference remains explicitly unverified, without another-browser workaround.

## Review Focus

- A six-character price grows after purchase: reflow must preserve its whole value and associated label (Task 1 geometry/purchase).
- `MAX` disables the action: visible text is retained and keyboard traversal does not depend on focusing disabled controls (Task 1 fixture).
- Full-height edge nav buttons clip an outside outline: inspect painted inset pixels, not only activeElement (Task 2 captures).
- Short landscape already scrolls: wrapping must preserve access without hiding commands or shrinking the world (Task 2 session).
- DPR/root-style injection masquerades as a native setting: the native session records actual preference and sentinel with no root override (Task 2).

### Task 1: Intrinsic upgrade reflow, relative type, and focused browser regression

**Files/ownership:** Implementer owns `src/ui/combat-focus.css`, `src/ui/continuation.css`, new `scripts/capture-upgrade-text-review.mjs`, `package.json`, and the narrow CI step/artifact in `.github/workflows/verify.yml`. Do not edit `main.ts`, other font selectors, or game code.

**Interfaces:** New package command `review:upgrade-text` runs the new script with the existing build/preview/browser lifecycle. The script writes `artifacts/browser-review/upgrade-text/diagnostics.json` and PNGs; exits nonzero on a targeted geometry/interaction/font failure. Diagnostics use `{revision,mechanism:'root-size-emulation'|'native-default-font',viewport,rootPx,labelPx,pricePx,worldHeight,rowHeights,checks,nativeStatus}`. Native execution is a separately recorded approved-browser case, not silently synthesized by the script.

- [ ] Add the minimal failing 320×568, 32px-root browser case first. Seed a normal age-0 save with food/base level 23, coins 10,000,000, unlocked troops, sound off. Assert label size 20px and price size 24px; current px fonts should fail. Capture the current layout and record the failure through CI; do not launch a local browser.
- [ ] Extend the probe to the exact eight width/scale sessions in the spec. For visible upgrade text, collect full word and numeric/suffix ranges with every client rectangle; assert x/y containment and no intersection with icon/other action/nav. Also assert shell bounds, no horizontal page overflow, world≥200, purchase target≥44×44, and center hit testing. Use actual text nodes, not source-string CSS tests.
- [ ] Make `.upgrade-row` intrinsically wrap with a `.25rem` row gap; give the label a min-content floor and keep its price non-shrinking/end-aligned when wrapped. Preserve single-line arrangement where it fits. Convert only the specified font sizes and retain the unitless 1.1 label line-height; leave art and world sizing untouched.
- [ ] Add the 3px / -3px inset focus rule for upgrade/nav buttons, preserving established gold and a real system-colour outline in forced colours. Keep the rule specific so it does not alter troop, pause, or modal focus styling.
- [ ] In each long-price session, inspect ready and running/paused layout; reach food/base through Tab, buy once with Enter/Space, and verify stable enabled button identity/focus, exactly one level/cost/coin change, and unchanged pause state for native Space. Recheck geometry for the new `225.9k`/`298.5k` prices. Add MAX at 320×568 for 100% and 200% only; expect level-100 buttons disabled with fully contained `MAX`.
- [ ] Run `npm test` and `npm run build` through the usual execution route, then the new probe through approved CI. Require targeted assertions to pass; inspect failing screenshots before changing any budget. Obtain review of the actual CSS/data-flow diff. Root commits the reviewed Task 1 files only after the targeted gate passes.

### Task 2: Painted focus, one native-font case, and bounded release verification

**Files/ownership:** Verification owner uses the new script/output and existing required browser scripts; root alone updates README and any narrow probe correction. No added product features or all-game typography migration.

**Interfaces consumed:** Task 1 diagnostics/captures plus actual approved-browser default-font controls. Record native-case evidence alongside the artifact with `nativeStatus:'verified'|'unverified'` and a specific reason if unverified; this field never pretends that root injection is native.

- [ ] Inspect 320px/200% food/base and first/last-nav before/after keyboard-focus screenshots, plus one 390px/100% comparison. Require a clearly painted ring on every edge, distinct from affordability/selection styling; inspect actual pixels. Reuse 320px/200% for one forced-colours pass. Fix only a reproduced clipping/visibility failure in the scoped rule.
- [ ] Run one 640×320, 200%-root long-price session through CI. Scroll naturally to both upgrades and all nav targets; verify focused targets are visible and hittable, no nested-scroll trap, and the existing ≥200px world remains. Preserve the existing portrait-column fallback.
- [ ] Perform one native default-font case in the approved browser at 320×568 with its actual preference set to 32px and no root/app override. Verify a test-only 1rem sentinel computes to 32px, labels to 20px, prices to 24px, then repeat containment/hit/focus checks. If preference control is unsupported, record `unverified` and the capability limit; do not switch browsers or relabel root emulation.
- [ ] Run existing required tests/build/browser/layering/save-session checks unchanged; do not add unrelated mastery/all-game diagnostic matrices. Inspect the new eight-session diagnostics, MAX results, focus PNGs, and one landscape artifact. Confirm the exact tested source is the reviewed PR head.
- [ ] Update README with scoped evidence and any explicit native-setting gap. Independently review the whole change. Root raises/merges only the reviewed change under existing authorization after required CI and painted-focus review pass; an unverified native case must remain disclosed and cannot support a native-font or whole-game accessibility claim.
