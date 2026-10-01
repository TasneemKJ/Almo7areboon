# Living Formations — Implementation Plan

**Goal:** Make the already-shipped defender/ranged protection and rally rules readable from the battlefield itself, without changing combat balance, saves, controls, or the authored world.

## IDEAL

- **Identify:** In current-build mobile evidence, defender protection is mechanically important but visually implicit; rally has a flag and text, yet the gathered company does not visibly share a formation language.
- **Discover:** Re-read the authoritative combat rule, renderer depth model, PR126 screenshots, accessibility/reduced-motion contracts, and official comparable-game descriptions on 2026-10-01. [Bad North's official press kit](https://www.badnorth.com/press-kit) says tactical mastery comes from observing simulated soldiers' behavior, while the [official Kingdom Two Crowns page](https://kingdomthegame.com/kingdom-two-crowns/) pairs minimalist strategy with protecting inhabitants and defenses. The design inference is to expose Almo7areboon's existing relationships through its own ink-and-pigment ground marks—not to copy mechanics, assets, or balance.
- **Explore:** Considered more help text, persistent overhead badges, relationship lines, and ground marks. More copy repeats recent teaching work; overhead badges compete with health and damage feedback; unrestricted links become spaghetti. Choose bounded foot-plane threads and knots derived from authoritative simulation state.
- **Act:** Add a pure, deterministic formation-mark model; render the six frontier-most truthful protector relationships per side and at most six rally knots, using three ground-sorted pools. Active protection is a continuous olive thread; a breached sole protector becomes separated clay stitches; rally knots connect a gathered troop to its assigned hold point. Reduced motion keeps the same static information.
- **Look back:** Unit-test rule parity, deterministic selection, malformed/large state bounds, reduced-motion invariance, and depth ordering. Run all source tests/build, then the GitHub Actions native Chromium journey at 320, 390, and 1024. Inspect original current-build screenshots for legibility, clutter, layering, and false relationships before merge.

## Five Ws

- **Who:** Players learning formations and experienced players reading crowded fights, including keyboard/screen-reader users who retain the existing textual guidance.
- **What:** A coherent on-field visual language for protected ranged troops, breached protection, and troops gathering at rally points.
- **Where:** On the battlefield foot plane behind actors and in front of the road, never over HUD, health bars, objective copy, or faces.
- **When:** Only while Chronicle combat is enabled and the authoritative relationship or rally assignment exists; paused and reduced-motion states remain truthful and static.
- **Why:** Let players understand a consequential tactic by watching their company, while preserving the existing simple controls and game economy.

## Non-goals and guardrails

- No damage, timing, targeting, reward, progression, route, save-schema, sound, or input changes.
- No new modal, tooltip, mandatory tutorial, automatic deployment, spending, or rally order.
- No full-screen grading, imported competitor material, per-frame allocations without a hard bound, or fixed foreground overlays.
- Enemy and player marks must remain distinguishable by hue plus line form; breach cannot be communicated by color alone.
- The renderer must use shared foot-plane sorting, preserve pause ownership, and expose no new interactive element.

## Test-driven steps

1. Add failing pure tests for active protection, breach, nearest deterministic protector selection, rally assignments, hard bounds, and ground depth.
2. Implement the pure formation-mark model, sharing the authoritative protection predicate with damage calculation so view and combat cannot drift.
3. Add three pooled ground graphics to `ChronicleView`; paint restrained threads, shield knots, split breach stitches, and rally hold knots from the pure model.
4. Extend the native Chronicle review with disclosed formation fixtures reached through real controls, original screenshots, runtime-error checks, and saved-state invariants.
5. Run focused tests, all tests, production build, independent code/bug review, GitHub Actions native playtest, original screenshot inspection, exact-tree merge verification, and production deployment verification.

## Evidence boundaries

Fixtures prepare unlocked content and resources; they are not campaign achievements. Source tests establish deterministic contracts. GitHub Actions screenshots establish rendered Chromium evidence at the captured viewports. None establishes physical-device/Safari acceptance, subjective fun, organic learning, low-end performance, or measured retention.
