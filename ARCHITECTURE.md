# Almo7areboon architecture

## Shape

A Vite + TypeScript app with Phaser 3 for the battlefield and native DOM for everything else. Imports point down:

```
game  ←  view  ←  ui  ←  main.ts
sim,     Phaser   DOM     input, navigation,
saves    art,     screens lifecycle, render loop
         audio    dialogs
```

| Folder | Owns |
|---|---|
| `src/game/` | Deterministic combat (`simulation.ts`), economy and quests (`data.ts`), cards (`cards.ts`), mastery seals, prestige/legacy, the Folktale tactics Chronicle (`chronicle*.ts`), battle orders, statistics, save decoding (`save.ts`), session ownership (`save-session.ts`) and backup (`backup.ts`) |
| `src/view/` | The Phaser battlefield, original vector art and storybook plates, atmosphere and grading, combat feedback, the synthesized soundscape (cancellable worker) |
| `src/ui/` | Screen templates, results, Journey, Chronicle, dialogs, modal tap guard, pause ownership, accessibility helpers, HUD text, `next-goal.ts` |
| `src/main.ts` | Wiring: event dispatch, tabs, modals, the frame loop, persistence calls |
| `public/` | Static files: icons, manifest, `sw.js` (offline cache; its install list is filled at build by the Vite plugin), storybook art |
| `art-source/storybook/` | Source art for the packing scripts (`scripts/prepare-storybook-art.cjs`, `prepare-storybook-icons.cjs`, which need `sharp`); shipped plates live in `public/art/` |

## State and saves

One `Profile` (schema version 5) plus a transient `BattleState`. Storage key `almo7areboon.save.v1`, backup `almo7areboon.save.v1.backup`. `decodeSave` migrates versions 1-5 (six-card prototypes widen to 30 cards), rejects corrupt data to a backup recovery path, and protects unknown future versions from overwrite. Web Locks give one saving tab; others pause behind recovery dialogs; temporary play never writes. Difficulty and rewards are decided in `game/`; `ui/` only presents them.

Optional profile fields, each validated in `validate` (`game/save.ts`) and omitted unless meaningful: `marks` (troop shapes), `graceDay` (streak grace), `weekly {week, baseSeals, claimed}` (weekly seal goal, `game/weekly.ts`), `lastSeen` (epoch ms, written on the saved copy only, rounded to the minute) and, in battle stats, `damageByKind`. Start over keeps `marks`, `graceDay` and `weekly` with the other preferences and daily state.

## Rules the tests enforce

- No rewards are granted while rendering; claims go through `Game.dispatch`.
- Pause ownership, receipts for unacknowledged victories, and save-session recovery are covered by `tests/main-integration.test.ts` and the `save-*` suites.
- The Vite build writes the offline manifest; `tests/` check it.
- CI layout (`tests/ci-layout.test.ts`): only `verify` runs on PRs; heavy workflows are manual/callable.

## Build, test, browser checks

`npm run build` (tsc + vite), `npm run test:fast` (PR gate), `npm test` (all, node:test with `--experimental-strip-types`), browser scripts under `scripts/` (`review:monkey`, `review:save-sessions`, `review:contrast`, `review:clip`, `review:overlap`, `review:layering`, the multi-engine suites in the manual workflows). See README "Running the full suite".

## Module size

Keep modules focused: new systems get their own file in the layer they belong to. `tests/architecture.test.ts` enforces the layer direction and a 500-line cap (listed exceptions only shrink). The battlefield is a thin `battlefield.ts` mount plus `battlefield-scene.ts` and its collaborators (`-army`, `-atmosphere`, `-effects`, `-marks`, `-overlays`, `-hud`, `-grade`, `-review`), each a small factory or pure painter; contract tests read them together through `tests/helpers/battlefield-source.ts`.
