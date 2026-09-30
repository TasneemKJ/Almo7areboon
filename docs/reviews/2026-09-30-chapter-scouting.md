# Scouting and self-teaching review

Iteration plan: `docs/superpowers/plans/2026-09-30-chapter-scouting.md`.

The branch adds truthful opponent scouting, optional repeatable battle help, first-win contextual guidance and six short fictional village voices. All are presentation changes; no rewards, combat rules, profile schema or save authority changes.

Independent review of the initial commit found one important defect: tutorial copy generalized the no-useful-target guard to Freeze, but Freeze starts and is consumed before enemies arrive. A public-action regression reproduced this, then failed on the misleading copy. The corrected tutorial explicitly warns that Freeze starts immediately. Combat semantics are preserved.

The reviewer also identified an evidence gap: existing inspection resets dialog scroll, so opened tutorial text might fall between screenshots. The native harness now scrolls each scouting/tutorial paragraph into view, asserts painted viewport bounds and captures it. Existing result/action inspection remains intact. This was included because the user's acceptance explicitly requires Playwright and visual review.

Five focused tests cover schedule values for every chapter, invalid input, fictional voice diversity, evolved-army/opponent mismatch, mutation-free rendering, first-time help and Freeze consumption. Native acceptance reuses actual-action victory fixtures and checks result voices through existing legacy and cleared-loss cases. Two extra scenarios exercise disclosure keyboard input, save byte invariants, chapter switching, ready/running guidance and absence of live overlays at 320x568 and 390x844. Fresh-win native scenarios assert first-time deploy guidance.

Local test/build results and native evidence are recorded in the PR. Native rendering, deployed revision and retention uplift cannot be inferred from source review. Playwright gates and root screenshot inspection remain required before merge.

Ruling: execute routine design and plan handoffs autonomously under the user's explicit iteration instruction; preserve an isolated sibling worktree without modifying repository ignore rules. Cost if the selected scope misses the intended personality: revise it after player feedback.
