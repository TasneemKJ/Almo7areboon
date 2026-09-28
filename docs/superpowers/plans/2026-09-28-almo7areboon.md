# Almo7areboon Implementation Plan

**Goal:** A faithful mobile-first recreation of the reference's core game.
**Architecture:** Typed deterministic simulation, Phaser presentation, DOM HUD. Rendering consumes GamePort, never owns gameplay rules.
**Tech Stack:** TypeScript, Phaser 3, Vite.
**Spec:** ../specs/2026-09-28-almo7areboon-design.md

## Global constraints
- Original code and artwork; reference layout/mechanics preserved.
- Phone-first, usable at 320px width, touch controls at least 44px.
- No writes under parent sources directory.

## Review focus
- Corrupt/unavailable local storage: start safely and communicate save failure.
- Insufficient funds and locked troops: no negative balances or illegal spawns.
- Tab hiding/modals: combat does not continue unexpectedly.
- Win/loss/retry/evolution: rewards cannot duplicate and transitions remain reachable.
- Resizing: troops, HUD, and controls remain visible and aligned.

## Tasks
- [ ] Simulation and tests: implement GamePort in src/game/simulation.ts, eras and prices in data.ts, validated saves in save.ts. Exercise food spending, pause, combat, rewards, six-era progression, skill limits, malformed saves.
- [ ] Visuals: implement src/view/battlefield.ts using GamePort; original vector army, base variants, world decoration, combat effects. Expose mountBattlefield(element,game,onFrame,onEvents), returning destroy().
- [ ] Interface: src/main.ts and style.css. Battle deployment/upgrades, evolution screen, cards, skills, settings, quests, accessible modal and keyboard navigation. Connect real actions and persistence.
- [ ] Verify: npm test, npm run build, desktop and mobile browser playthrough, screenshot review, final independent review. Document evidence and any limitations.

## Execution record
The user's confirmed direction is a clone and mobile-first web game. Proceed with authorized implementation, using independent modules for simulation and visuals; integrate and verify centrally. Local working copy is an initially empty GitHub clone; external publishing is a separate final action.
