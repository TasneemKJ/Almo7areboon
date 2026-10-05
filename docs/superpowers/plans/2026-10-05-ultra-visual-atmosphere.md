# Ultra Visual Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stronger storybook atmospheric perspective to each Levantine dusk battlefield without reducing combat readability.
**Architecture:** Extend the source-space `DuskMark` plan and reuse the existing Phaser Graphics atmosphere layer; no new per-frame game objects or simulation state.
**Tech Stack:** TypeScript, Phaser 3, Vite, node:test.
**Spec:** docs/superpowers/specs/2026-10-05-ultra-visual-atmosphere-design.md

## Global Constraints
- Preserve portrait play, authored chapter art, low-chrome battle UI, deterministic simulation, reduced motion and renderer fallback.
- No balance, reward, save, monetization or progression changes.

## Review Focus
- New depth marks never enter the battle road.
- Six chapters remain visually distinct.
- Reduced motion is stable.
- Invalid scene/time inputs stay finite.
- Shape count remains bounded.

---

### Task 1: Chapter depth marks
**Files:** Modify `tests/dusk-atmosphere.test.ts`; Modify `src/view/dusk-atmosphere.ts`.
**Interfaces:** Extends `DuskMark.kind` with `'depth'`.
- [ ] Add failing tests requiring two bounded depth marks per chapter with distinct chapter colors.
- [ ] Run focused node:test; expect FAIL because depth marks are absent.
- [ ] Add deterministic far/near source-space depth marks.
- [ ] Re-run focused test; expect PASS.
- [ ] Commit.

### Task 2: Paint atmospheric hierarchy
**Files:** Modify `src/view/dusk-atmosphere.ts`; Modify `DESIGN.md`.
**Interfaces:** Consumes depth marks through existing `paintDuskAtmosphere`.
- [ ] Add assertions that depth marks paint as soft fills, never ripples, and remain under road threshold.
- [ ] Run focused test; expect FAIL on paint expectations.
- [ ] Give depth marks separate soft opacity treatment while reusing the same Graphics object.
- [ ] Run `npm test`, `npm run build`, `npm run review:browser`, `npm run review:overlap`, `npm run review:contrast`.
- [ ] Commit.

RED gate trigger: PR synchronization only; no production code in this commit.
