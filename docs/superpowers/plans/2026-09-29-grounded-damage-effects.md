# Grounded Damage and Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep structural damage on painted buildings and source-attached combat effects at their source lane depth.

**Architecture:** Use chapter-specific crack attachment geometry verified against shipped shelter alpha. Pool three graphics objects inside the existing ground-sorted actor container for attack cues and lane-tagged dust; retain aerial projectiles, impact readability effects and HUD layers.

**Tech Stack:** TypeScript, Phaser 3, Node tests, Playwright browser verification.

**Spec:** Parent task instruction in this conversation: fix confirmed cracks outside painted alpha and physical effects above nearer actors; retain Canvas/WebGL compatibility, avoid per-frame masking, no broad asset repaint, no commit/push.

## Global Constraints

- Change presentation only; do not change simulation or save data.
- Keep legacy chapter 5–6 art and damage behavior.
- Do not commit or push; root coordinates review and publication.
- Use real render/geometry regressions, not new source-string assertions.

## Review Focus

- Enemy mirroring must retain crack containment.
- Particle drift must not change the lane at which it sorts.
- Resize must reposition effect depth with the ground baseline.
- Reduced motion/reset must clear every pooled effect graphic.
- Delayed projectiles and intentional readability glows remain above actors.

### Task 1: Attach cracks to authored buildings

**Files:** Modify `src/view/base-damage.ts`; create geometry regression fixtures/tests and alpha validation browser coverage as needed.

**Interfaces:** `baseDamageFrame` keeps its existing signature and mark format. Cracks use authored per-age tuples for ages 0–3, unchanged tuples for ages 4–5.

- [x] Write a failing containment regression for First Fires worn damage and Olive critical damage, covering both teams and the outline thickness.
- [x] Run it and confirm the known strokes leave source alpha.
- [x] Supply inspected per-chapter attachment tuples without per-frame masks or texture work.
- [x] Verify containment for all four painted chapters at worn/critical HP.

### Task 2: Sort physical effects with their source lanes

**Files:** Modify `src/view/battlefield.ts`; create `src/view/ground-effects.ts` and `tests/ground-effects.test.ts` for stable routing/depth policy.

**Interfaces:** Helper selects the pooled lane and ground depth; emitted dust records retain the emission lane. Three graphics objects belong to `armyLayer` and sort just above their same-lane troop, below nearer buildings/troops.

- [x] Write failing behavioral routing/depth tests for rear/middle/front source cues and drifting dust.
- [x] Run and confirm the missing behavior fails.
- [x] Route attack cues and explicitly lane-tagged dust to pooled graphics. Preserve existing upper-layer projectiles/glows/impact accents.
- [x] Check reset/reduced-motion clearing paths and resize depth policy, then run `npm test` and `npm run build`.

### Final verification and handoff

- [x] Supply root deterministic fixture contract: three lanes overlapping a base, worn First Fires, critical Olive/Lantern, both renderers and viewport sizes. Separate fixture agent implements browser coverage.
- [x] Report exact verification, tradeoffs and changed files; root performs independent review and publication.

## Execution ledger

- Plan authorized for immediate implementation by parent. No permission pause required.
- Existing source-string tests are retained only where unrelated; meaningful geometry/routing regressions cover the new behavior.
- Task 1 RED: containment regression found 16 escaping chapter/side/health combinations; GREEN: all four painted shelters and both sides pass with authored attachments. Legacy chapters retain their original tuples.
- Task 2 RED: three stable routing/depth tests failed before the helper existed; GREEN: rear/middle/front occlusion order, particle drift, overlay preservation and malformed source lanes pass.
- Ruling: keep existing crack angle convention and validate both mirrored textures independently; correcting stroke handedness is unnecessary to repair containment and would broaden visual change.
- Ruling: remove the now-empty upper actionFx graphics object; all source cues use the three pooled lane graphics. Upper impact/projectile/glow/readability layers remain unchanged.
- Verification: `npm test` passes 282/282; `npm run build` succeeds (existing npm proxy configuration and large Phaser chunk warnings). Browser fixture execution is owned by the root/fixture agent and remains pending in an environment with Chromium.
