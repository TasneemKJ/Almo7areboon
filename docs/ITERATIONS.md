# 40-pass implementation and verification record

Date: 2026-09-29. Repository: TasneemKJ/Almo7areboon. Target branch: `feat/finish-core-40-passes`.

## Provenance and counting

The remote branch was still at `14ccf26b2499fac0f809b53b4bde1de9ce2400d7`, with CI-only changes. Core and helper code was recovered from the previously created, uncommitted tree `e981707065970106ee759158ca284842c024876b`. Earlier conversational claims that 34 iterations were complete were not treated as evidence.

These are 40 tracked implementation/recovery/review scopes, not 40 independent visual playthroughs or 40 newly written features. Recovered work is identified as such. Each scope has code or test evidence; the rendered mobile acceptance on passes 36 and 37 is still blocked. **38 scopes have automated or source-review evidence; two remain pending visual sign-off.** All browser-specific release gates remain open regardless of the numerical ledger.

| Pass | Outcome | Evidence and limit |
| --- | --- | --- |
| 01 | Recover evolution resets | progression.test.ts; coins, upgrades and unlocks reset |
| 02 | Recover unlocked-battle replay | progression.test.ts; invalid/locked selection rejected |
| 03 | Recover timeline economy reset | progression.test.ts; permanent progress retained |
| 04 | Migrate furthest-unlocked battle | progression.test.ts; old-save migration |
| 05 | Recover era costs and reward scaling | reference.test.ts; data.ts; later tuning provisional |
| 06 | Integrate all 30 card identities | recovery.test.ts P06; cards.test.ts |
| 07 | Connect seeded multi-card packs | recovery.test.ts P07; persisted stream |
| 08 | Protect capped/partial packs atomically | recovery.test.ts P08; robustness.test.ts |
| 09 | Apply secondary passive bonuses | recovery.test.ts P09; card bonus tests |
| 10 | Preserve legacy collection meaning | recovery.test.ts P10; game.test.ts migration |
| 11 | Resume pending victory without double rewards | recovery.test.ts P11 |
| 12 | Record real battle statistics | recovery.test.ts P12; reset and persistence |
| 13 | Credit actual wallet-limited earnings | recovery.test.ts P13 |
| 14 | Expose resolved source/target and actual damage | recovery.test.ts P14 |
| 15 | Explain deployment pause/food/congestion | recovery.test.ts P15; no charge on blocked spawn |
| 16 | Reject skills with no useful effect | recovery.test.ts P16 |
| 17 | Keep independent pause owners | interface.test.ts P17; menu close preserves manual pause |
| 18 | Recover corrupt primary from backup | recovery.test.ts P18 |
| 19 | Protect future-version saves and backups | recovery.test.ts P19; robustness.test.ts |
| 20 | Validate and confirm save import/export | interface.test.ts P20; storage failure keeps game |
| 21 | Verify normal-action six-era campaigns | campaign.test.ts; basic and mixed formations |
| 22 | Connect card collection, packs and result summaries | interface.test.ts P22; template/function evidence |
| 23 | Connect battle selector | interface.test.ts P23; unlocked-state template |
| 24 | Explain and confirm evolution resets | interface.test.ts P24 |
| 25 | Add modal focus wrapping and background isolation | interface.test.ts P25; browser focus still unverified |
| 26 | Guard gameplay shortcuts while editing | interface.test.ts P26; helper/source contract |
| 27 | Preserve troop control nodes between unchanged updates | interface.test.ts P27; cached updater |
| 28 | Contextual guidance and bounded health labels | interface.test.ts P28 |
| 29 | Show next upgrade values and cap state | recovery.test.ts P29 |
| 30 | Derive wave countdown from actual battle state | recovery.test.ts P30 |
| 31 | Show earned rewards and battle statistics | interface.test.ts P31; restored result template |
| 32 | Keep audio optional and handle rejected browser promises | audio.test.ts; real speaker/audio-gesture test pending |
| 33 | Wire reduced motion and resolved-hit projectiles | interface.test.ts P33; renderer source reviewed, appearance unverified |
| 34 | Clean up listeners, timers, renderer and audio | interface.test.ts P34; lifetime behavior |
| 35 | Avoid redundant markup and hidden-screen scene work | interface.test.ts P35; no measured frame-rate claim |
| 36 | Add compact portrait and touch-size rules | layout-contract.test.ts P36; **rendered 320x568 / 390x844 acceptance pending** |
| 37 | Add short-landscape scrolling instead of clipping | layout-contract.test.ts P37; **rendered landscape acceptance pending** |
| 38 | Isolate inactive screens from navigation/input | interface.test.ts P38; source contract, not browser E2E |
| 39 | Require passing tests and build for CI artifact | robustness.test.ts P39; final review RED-to-GREEN |
| 40 | Integrated numeric stress, build and author review | robustness.test.ts P40; 82/82 suite, build, diff check |

## Decisions made

- Recovered useful prior code rather than discarding it merely because its earlier test-first provenance could not be verified. It was exercised locally before publication. Cost if wrong: defects outside the current coverage may remain.
- Preserved the existing reset design instead of old prototype test expectations: evolution clears the age economy and legacy saves migrate to 30 cards. Cost if wrong: pacing differs from the desired reference behavior.
- Increased the basic-only campaign budget from 150 to 180 seconds after normal-action probes; added a mixed-army 90-second campaign instead of weakening combat to fit the old timeout. Cost if wrong: basic-only pacing may feel slow; human playtesting is still needed.
- Kept browser-policy blocks intact; source and component checks are explicitly not visual verification. Cost: mobile and release sign-off remain unfinished.
- Final review was author self-review because no independent agent was available. Cost: shared author blind spots remain.

## Deferred limitations

Rendered mobile/browser QA, independent review, low-end frame-rate measurements and Phaser vendor-size reduction remain open. Full reference live-service content and hidden balance equivalence are outside this core delivery. Nothing was merged or deployed by this work.


## Development & Visuals — 2026-10-05 / Iteration 1

**Direct battlefield orders (candidate).** Base `32d050951e4bf47f1288408c62ae9100c4cf5622`. Adds a neutral-center, bounded-tap path from the painted battlefield to the already-authoritative Hold/Advance action while keeping buttons as accessible fallbacks. The regression was observed red on test-first head `30f652e504c44b8d23cf880bd73b72708022dfe8`. Final exact-head Actions/browser evidence and merge confirmation remain required before this entry can be called delivered; see `docs/designs/2026-10-05-direct-battlefield-orders.md`.
