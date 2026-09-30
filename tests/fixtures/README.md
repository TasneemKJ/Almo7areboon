# Frozen battlefield layering review

Run `npm run review:layering` after installing Playwright Chromium. The script
starts Vite on port 4174 and stores PNG screenshots plus runtime diagnostics in
`artifacts/browser-review/layering/`. CI publishes that directory separately.

To inspect a case manually, run `npm run dev` and open
`/tests/fixtures/layering.html?age=3&enemyAge=3&health=25&lane=0&effects=both`.
Chapter indices are zero-based. `health` accepts 25, 70 or 100; `lane` accepts
0, 1 or 2; `effects` accepts `none`, `attack`, `dust` or `both`; `troops=0` hides
the troops for isolated base review. `enemyAge=5&age=4` shows the adjacent
painted Hillside and Courtyards chapters in one battlefield.

The fixture imports the production battlefield renderer, supplies a complete
Game-created state through a no-op GamePort, and freezes presentation by pausing
that state. Real hit/spawn events produce attack cues and foot dust. It does not
load production `main.ts`, modify saves, or add a fixture entry to the production
build. A test-only Phaser plugin observes actual display objects and paint order.

The 39 cases cover both mirrored sides, chapters 0/1/3/4/5 at 70% and 25% base health,
all three lanes, isolated critical bases, isolated rear-lane source effects, and
the 3/4 and 4/5 painted transitions. Assertions check actual sprite overlap, base mirroring,
resolution, damage drawing, and occlusion of troops, damage, source attack cues,
and foot dust. PNGs provide human review of the artwork and damage attachment;
the geometry tests separately verify crack containment against decoded alpha.

Expected occlusion: rear-lane troops and their source effects pass behind bases;
middle/front-lane troops and source effects pass in front. Changing those effects
back to the global foreground layer must fail the runtime paint-order checks.
The script records failures and continues capturing remaining cases for review.


Tactical feedback is opt-in: `traits=guard|pierce|sweep|all` adds positive,
resolved production hit events at separated target coordinates. `motion=reduced`
selects the real reduced-motion policy, and `width=320|390` resizes the scene for
phone captures. The defaults remain unchanged, retaining all 39 layering cases.
`npm run review:browser` also serves this fixture on port 4175 and checks that
all three accents paint their target lane, sweep emits no second source cue or
projectile, reduced motion suppresses travel, and static target coordinates hold.

Additional production captures go to the existing portrait artifact directory:
`33-first-fires-opening-{320,390}.png`, `34-incoming-volley-{320,390}.png`,
`35-incoming-bulwark-{320,390}.png`, and
`36-trait-feedback-{system,reduced}-{320,390}.png`. They supplement the original
32 production screenshots. The trait screenshots are deterministic frozen
renderer views, not live-combat timing guesses. Test diagnostics never enter
the production entry or build.
