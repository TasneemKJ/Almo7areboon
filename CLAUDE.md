# CLAUDE.md

**Read `AGENTS.md` first.** It holds the iteration workflow, the guards and the owner's standing rules. This file keeps the day-to-day conventions for **Almo7areboon**, a mobile-first Levantine folk-tale battle game (TypeScript, Phaser 3, Vite).

## Run and verify

`npm ci`, then `npm run dev` (Vite, set a port you own). `npm run build` type-checks and builds `dist/`. `npm run test:fast` is the quick unit set used by the PR gate; `npm test` runs everything and should pass before a push. Browser checks live under `scripts/` (`npm run review:*`); set `REVIEW_PORT_BASE` (for example 4330) to move every review port so another checkout cannot collide with yours. Node 22.18+.

## Code organization

- `src/game/`: typed deterministic simulation, economy, cards, saves. No DOM beyond the injectable storage in `save.ts`.
- `src/view/`: Phaser rendering, vector art, combat feedback, synthesized audio.
- `src/ui/`: DOM templates, dialogs, pause and focus helpers, per-screen presentation (small pure functions plus CSS).
- `src/main.ts`: input, navigation, lifecycle, the render loop. `index.html`, `src/style.css` and the `src/ui/*.css` files carry the styles.

## Conventions

- Preserve `almo7areboon.save.v1` and its backup; new profile fields are optional and normalized in `decodeSave`.
- State changes go through `Game.dispatch`; UI reads state and never awards rewards while rendering.
- Keep text in the existing English copy style; controls are native buttons at least 44px.
- Every fix gets a test in `tests/`; tests that load `main.ts` through a stub list the imports it needs (`tests/main-integration.test.ts`).
- Verify in a browser at phone width with touch, and view the screenshots.
