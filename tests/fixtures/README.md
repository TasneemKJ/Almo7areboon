# Frozen battlefield layering review

Run `npm run review:layering` after installing Playwright Chromium. The script
starts Vite on port 4174 and stores PNG screenshots plus runtime diagnostics in
`artifacts/browser-review/layering/`. CI publishes that directory separately.

To inspect a case manually, run `npm run dev` and open
`/tests/fixtures/layering.html?age=3&enemyAge=3&health=25&lane=0&effects=both`.
Chapter indices are zero-based. `health` accepts 25, 70 or 100; `lane` accepts
0, 1 or 2; `effects` accepts `none`, `attack`, `dust` or `both`; `troops=0` hides
the troops for isolated base review. `enemyAge=4&age=3` shows the present
painted/vector chapter boundary.

The fixture imports the production battlefield renderer, supplies a complete
Game-created state through a no-op GamePort, and freezes presentation by pausing
that state. Real hit/spawn events produce attack cues and foot dust. It does not
load production `main.ts`, modify saves, or add a fixture entry to the production
build. A test-only Phaser plugin observes actual display objects and paint order.

The 24 cases cover both mirrored sides, chapters 0/1/3 at 70% and 25% base health,
all three lanes, isolated critical bases, isolated rear-lane source effects, and
the 3/4 chapter boundary. Assertions check actual sprite overlap, base mirroring,
resolution, damage drawing, and occlusion of troops, damage, source attack cues,
and foot dust. PNGs provide human review of the artwork and damage attachment;
the geometry tests separately verify crack containment against decoded alpha.

Expected occlusion: rear-lane troops and their source effects pass behind bases;
middle/front-lane troops and source effects pass in front. Changing those effects
back to the global foreground layer must fail the runtime paint-order checks.
The script records failures and continues capturing remaining cases for review.
