# Almo7areboon

A mobile-first, portrait web recreation of the **We Are Warriors!** core loop, built with TypeScript, Phaser 3 and Vite. The source and vector artwork are original.

## Folktale tactics expansion

The original combat loop now has an optional Levantine storybook journey: rally and release formations, supporting troop relationships, skill combinations, tactical landmarks, escort/watch/rescue/night missions, the interruptible Bell Keeper, captains, veterans, featured tales, restored homes, discoveries, three-encounter expeditions and alternate timeline rules. **Open the storybook** from the ready battlefield or a battle result. One captain replaces Food Drop; the other existing controls remain.

See [the twenty-idea scope and acceptance record](docs/FOLKTALE-TACTICS.md) for how each feature works, tests, browser evidence and explicit limits. This is a playable first release, not a claim of measured retention, completed Arabic/RTL, physical-device/Safari acceptance or a finished bespoke cinematic asset library. The permanent read-only `Folktale tactics review` workflow captures portrait and desktop Chromium fixtures.

## Current delivery

The deterministic core, 30-card collection, progression and save recovery are implemented. The illustrated visual overhaul adds six environments, redesigned armies and a coordinated mobile interface. Its local suite (`npm test`) and the production build pass; the test count is deliberately not quoted here because it changes with every iteration. This is **not** a verified pixel-exact clone or a complete recreation of the reference's live-service systems.

The early visual-overhaul record predates the current Chromium browser gates. Component tests and CSS/source checks do not replace rendered browser checks, and touch-device/Safari acceptance remains separate and unfinished. See the [visual-overhaul evidence](docs/VISUAL-OVERHAUL.md), [core verification](docs/VERIFICATION.md), [original 40-pass record](docs/ITERATIONS.md) and [folktale expansion review](docs/FOLKTALE-TACTICS.md).

## Levantine continuation

The active visual branch adds original Levantine dusk settlements, chapter wardrobes, twelve faction outposts and a consistent six-chapter journey. These are fictional settings rather than exact historical reconstructions. Combat, prices and saves keep their original internal identifiers. A quiet original six-chapter soundscape is now available after an enabled user gesture; Settings provides a separate Atmosphere switch under master Sound. Audio generation uses a cancellable worker. Arabic/RTL localization and real device/audio acceptance remain unfinished. The [refinement record](docs/levantine-40/PROGRESS.md) separates the seventeen implemented batches from the forty-iteration goal and still-pending browser acceptance. No scheduled job is used.

## Run locally

Use Node.js 22.18+ (Node 24 is also suitable).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Serve the generated `dist/` directory on a static HTTP host. Opening `index.html` directly with a `file:` URL is not the supported route. No accounts, API keys, database or backend are required. Production builds register a small service worker (`public/sw.js`) that remembers what the game has loaded, so a returning player can start offline after a single visit; chapter art not yet seen still needs a connection, and old bundles are trimmed so the cache stays small. These commands do not publish the game.

## Play

Tap **Battle**, accumulate food, then tap a troop to deploy it. Troops march, fight and attack bases automatically. Combine melee or heavy troops with ranged support. Coins earned during defeat remain available for production, base health and troop upgrades.

Victory unlocks the next opponent. **Choose a battle** replays unlocked opponents while ready. **Evolution** strengthens your own army and clears coins, upgrades and troop unlocks. Your selected opponent, unlocked chapters and earned seals stay; its confirmation explains exactly what resets. Finishing the final opponent begins a harder timeline.

The 30-card collection applies passive bonuses automatically. Summon packs contain 1, 10 or 50 cards, cost earned gems and use a saved random stream. Duplicates advance levels. The interface shows rarity odds, duplicate progress and the arithmetic safety cap. There are no real-money purchases.

Quests pay gems for kill, deployment and win milestones, and a daily reward pays 30 gems (rising 10 per consecutive local day to 90) once per local calendar day; missing a day restarts the streak. Both light the notification dot on the quests button.

The default skills are Freeze, Meteor and Food Drop, each usable once per battle. A selected story captain replaces Food Drop with the captain's ability. A Meteor without enemies and a default Food Drop at full storage do not consume the skill. Result screens show real deployment, damage, food, kill and army-size statistics.

Settings include sound, 1x/2x speed, reduced motion, JSON save export and confirmed import. Keyboard: **1/2/3** deploy; **Q/W/E** use skills; **Space** starts or pauses outside a button; **Escape** closes ordinary dialogs. Menus, other screens and hidden tabs pause combat without canceling a manual pause.

## Saves

The storage key remains `almo7areboon.save.v1` for compatibility, but its profile schema is version 5. Six-card prototype saves migrate to the 30-card collection. A separate validated backup can recover a corrupt primary save. Unknown future save versions are protected from overwrite.

Only one tab can actively save on HTTPS or localhost using Web Locks. A second tab pauses behind **Game open in another tab**. Close the saving tab, then select **CONTINUE HERE** to load its latest saved progress. Merely hiding the saving tab keeps its ownership. If another client changes either save copy, the current tab pauses and offers **LOAD SAVED PROGRESS**; **EXPORT THIS SESSION** rescues its current in-memory progress before reloading.

If this browser cannot safely acquire ownership, or a future-version save is present, **PLAY WITHOUT SAVING** explicitly starts temporary play. Its persistent notice stays visible; progress and profile preferences do not change either stored save, and import is disabled. Temporary play never automatically becomes a saving session. Export before closing to retain that session.

An unfinished battle reloads ready while preserving already earned coins. An unacknowledged victory reloads its result without awarding rewards again. Import validates first, asks before replacement and changes the active game only after storage succeeds. Export provides a separate backup. Older already-open builds and console scripts may ignore Web Locks; baseline checks detect their changes but are not an atomic transaction against an uncooperative writer. Close older tabs and reload after a conflict. Browser storage eviction, clearing site data, and termination before a save can still lose progress.

`npm run review:save-sessions` checks the built app with same-context Chromium tabs on port 4175, real buttons, takeover, recovery/export, import, confirmed Start over, and controlled pagehide/pageshow events. CI requires it alongside the portrait and layering gates; diagnostics and 320px recovery screenshots are collected. Controlled lifecycle events do not prove actual BFCache eligibility, and this gate does not establish WebKit or physical-device acceptance.

## Source boundaries

- `src/game/`: typed deterministic combat, economy, cards, statistics, saves and backup transactions.
- `src/view/`: original vector art, Phaser rendering, combat feedback and optional synthesized sound.
- `src/ui/`: screen templates, pause ownership, modal/focus helpers, cached DOM updates and responsive additions.
- `src/main.ts`: input, screen navigation and lifecycle integration.
- `tests/`: simulation, progression, persistence, components, audio failures and explicit source/CSS contracts.

The browser probes are summarised in [docs/quality-probes.md](docs/quality-probes.md). `npm run review:monkey` (against a running preview) starts the game on seven damaged or missing saves and then feeds it random taps and keys, failing on any uncaught page error; set `CHROMIUM_PATH` to reuse an installed Chromium. `npm run review:contrast` screenshots the area behind every text element on each screen and dialog and lists candidates below WCAG AA (read the list: partly hidden elements and containers with icons can be false positives). `npm run review:clip` measures every text run on each screen and dialog at 320 and 390px and fails if an `overflow: hidden` ancestor cuts it off or it runs past the viewport (text inside scrolling containers is fine). `npm run review:overlap` checks that the main HUD elements never overlap at six phone and tablet sizes, even with very large coin and gem totals.

GitHub Actions runs tests and the production build with read-only repository permissions. The `almo7areboon-web-build` artifact is published only when both checks succeed; this is a downloadable artifact, not a deployment.

## Fidelity and limits

Food-to-troop combat, melee/ranged/heavy choices, six eras with 18 appearances, evolution, upgrades, cards and skills are recreated. Original hidden tuning is not available: era rewards, later-age balance and some card curves remain provisional. The original reference's heroes, runes, dungeons, live events, ads, purchases and backend services are not included. The original story captains, expeditions and rule-based alternate timelines in this expansion are separate systems, not recreations of those reference features. Phaser's vendor bundle still produces a size warning; low-end device performance is unmeasured.

Reference: [We Are Warriors! on Google Play](https://play.google.com/store/apps/details?id=com.vjsjlqvlmp.wearewarriors&hl=en_GB).

Known accessibility limits: upgrade labels and prices use relative font sizes with intrinsic wrapping; the focused browser harness covers 100/125/150/200% root-size emulation. Native persistent default-font preference remains unverified, and other game text still uses fixed pixel sizes. Rotating the device resizes the battlefield correctly, but landscape shows a 480px column that scrolls vertically; the installed app is locked to portrait. Reduced motion and forced-colours modes are honoured.
