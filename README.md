# Almo7areboon

**Work-in-progress checkpoint — 2026-09-28.** This commit preserves the implementation so far. The current suite has 37 passing and 6 failing tests; the production build is blocked by unfinished battle-progression types. The 30-card module is implemented but not yet connected to gameplay. See [verification status](docs/VERIFICATION.md). The requested full clone is not complete.

A portrait, mobile-first web recreation of the core **We Are Warriors!** battle loop. Built with TypeScript, Phaser 3, and Vite, with original vector artwork and no external asset requests.

## Play locally

Requires Node.js 22.18+ (Node 24+ recommended).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To play on a phone, connect the phone to the same Wi-Fi and use the printed Network URL. The game fits a portrait phone and is centered on desktop.

```sh
npm test       # deterministic combat, economy, progression, and save tests
npm run build # TypeScript validation and optimized production output
npm run preview
```

Upload the generated `dist/` directory to a static host to publish. No server, accounts, keys, or database are required. Publication is not performed by these commands.

## Controls and game loop

- Tap **Battle**, let food accumulate, and tap a troop to deploy it.
- Warriors automatically march, fight, and attack the opposing base. Combine a front line with ranged troops.
- Buy **Food Production** and **Base Health** upgrades using coins. Battle earnings remain after defeat.
- Unlock the ranged and heavy troops for 150 and 400 coins.
- **Freeze**, **Meteor**, and **Food Drop** are each usable once per battle.
- Destroying the enemy base advances the opposing age. Use **Evolution** to upgrade your own army.
- Six ages have 18 unit appearances and six base designs. Finishing the final enemy age begins a harder timeline.
- Complete quests to earn gems; spend gems on passive cards. Duplicates raise a card's level.
- Settings include sound and 1×/2× speed. Background tabs and open menus pause the simulation.

Keyboard: `1` / `2` / `3` deploy troops; `Q` / `W` / `E` use skills; `Space` pauses when focus is outside a button. `Escape` closes regular dialogs.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/game/types.ts` | Shared simulation/presentation contract |
| `src/game/data.ts` | Era/unit tuning, upgrade prices, cards, quests |
| `src/game/simulation.ts` | Deterministic fixed-step battle and progression |
| `src/game/save.ts` | Versioned, validated browser-local progress |
| `src/view/art.ts` | Original troops, bases, and SVG portraits |
| `src/view/battlefield.ts` | Phaser environment, animation, and effects |
| `src/main.ts` | Touch UI, dialogs, screen navigation, input, persistence |
| `src/style.css` | Responsive portrait interface |
| `tests/game.test.ts` | Gameplay and save invariants |

## Save behavior

Progress is stored under `almo7areboon.save.v1` in this browser's local storage. Coins, gems, upgrades, cards, quests, and age progress persist. An unfinished battle restarts from its ready state after a reload; earned coins remain. Clearing site data clears progress. Invalid or unavailable stored data falls back safely to a fresh profile; storage failure shows a notice.

## Fidelity and scope

The reference's food-to-troop economy, automatic base combat, melee/ranged/heavy choices, age evolution, upgrade loop, cards, skills, and portrait cartoon presentation are recreated here. The artwork and source are original. Exact proprietary tuning, source code, audio, sprites, full card collection, live events, ads, purchases, and backend services are not included. Balance values are exposed in `data.ts`; this is a playable recreation, not a byte-for-byte or verified pixel-exact copy.

Reference: [We Are Warriors! on Google Play](https://play.google.com/store/apps/details?id=com.vjsjlqvlmp.wearewarriors&hl=en_GB).
