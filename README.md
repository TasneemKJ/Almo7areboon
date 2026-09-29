# Almo7areboon

A mobile-first, portrait web recreation of the **We Are Warriors!** core loop, built with TypeScript, Phaser 3 and Vite. The source and vector artwork are original.

## Current delivery

The deterministic core, 30-card collection, progression and save recovery are implemented. The illustrated visual overhaul adds six environments, redesigned armies and a coordinated mobile interface. Its current local suite has **246 passing tests** and the production build succeeds. This is **not** a verified pixel-exact clone or a complete recreation of the reference's live-service systems.

Rendered browser, screenshot, touch-device and Safari verification remain pending because the available browser route was blocked. Component tests and CSS/source checks do not replace those checks. See the [visual-overhaul evidence](docs/VISUAL-OVERHAUL.md), [core verification](docs/VERIFICATION.md) and the [original 40-pass record](docs/ITERATIONS.md).

## Levantine continuation

The active visual branch adds original Levantine dusk settlements, chapter wardrobes, twelve faction outposts and a consistent six-chapter journey. These are fictional settings rather than exact historical reconstructions. Combat, prices and saves keep their original internal identifiers. A quiet original six-chapter soundscape is now available after an enabled user gesture; Settings provides a separate Atmosphere switch under master Sound. Audio generation uses a cancellable worker. Arabic/RTL localization and real device/audio acceptance remain unfinished. The [refinement record](docs/levantine-40/PROGRESS.md) separates the sixteen implemented batches from the forty-iteration goal and still-pending browser acceptance. No scheduled job is used.

## Run locally

Use Node.js 22.18+ (Node 24 is also suitable).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Serve the generated `dist/` directory on a static HTTP host. Opening `index.html` directly with a `file:` URL is not the supported route. No accounts, API keys, database or backend are required. These commands do not publish the game.

## Play

Tap **Battle**, accumulate food, then tap a troop to deploy it. Troops march, fight and attack bases automatically. Combine melee or heavy troops with ranged support. Coins earned during defeat remain available for production, base health and troop upgrades.

Victory unlocks the next opponent. **Choose a battle** replays unlocked opponents while ready. **Evolution** strengthens your own army but clears coins, upgrades, troop unlocks and unlocked battles; its confirmation explains exactly what resets. Finishing the final opponent begins a harder timeline.

The 30-card collection applies passive bonuses automatically. Summon packs contain 1, 10 or 50 cards, cost earned gems and use a saved random stream. Duplicates advance levels. The interface shows rarity odds, duplicate progress and the arithmetic safety cap. There are no real-money purchases.

Freeze, Meteor and Food Drop can each be used once per battle. A Meteor without enemies and a Food Drop at full storage do not consume the skill. Result screens show real deployment, damage, food, kill and army-size statistics.

Settings include sound, 1x/2x speed, reduced motion, JSON save export and confirmed import. Keyboard: **1/2/3** deploy; **Q/W/E** use skills; **Space** starts or pauses outside a button; **Escape** closes ordinary dialogs. Menus, other screens and hidden tabs pause combat without canceling a manual pause.

## Saves

The storage key remains `almo7areboon.save.v1` for compatibility, but its profile schema is version 2. Six-card prototype saves migrate to the 30-card collection. A separate validated backup can recover a corrupt primary save. Unknown future save versions are protected from overwrite.

An unfinished battle reloads ready while preserving already earned coins. An unacknowledged victory reloads its result without awarding rewards again. Import validates first, asks before replacement and changes the active game only after storage succeeds. Export provides a separate backup; clearing browser site data otherwise removes local progress.

## Source boundaries

- `src/game/`: typed deterministic combat, economy, cards, statistics, saves and backup transactions.
- `src/view/`: original vector art, Phaser rendering, combat feedback and optional synthesized sound.
- `src/ui/`: screen templates, pause ownership, modal/focus helpers, cached DOM updates and responsive additions.
- `src/main.ts`: input, screen navigation and lifecycle integration.
- `tests/`: simulation, progression, persistence, components, audio failures and explicit source/CSS contracts.

GitHub Actions runs tests and the production build with read-only repository permissions. The `almo7areboon-web-build` artifact is published only when both checks succeed; this is a downloadable artifact, not a deployment.

## Fidelity and limits

Food-to-troop combat, melee/ranged/heavy choices, six eras with 18 appearances, evolution, upgrades, cards and skills are recreated. Original hidden tuning is not available: era rewards, later-age balance and some card curves remain provisional. Heroes, runes, dungeons, events, full timeline content, ads, purchases and backend services are not included. Phaser's vendor bundle still produces a size warning; low-end device performance is unmeasured.

Reference: [We Are Warriors! on Google Play](https://play.google.com/store/apps/details?id=com.vjsjlqvlmp.wearewarriors&hl=en_GB).
