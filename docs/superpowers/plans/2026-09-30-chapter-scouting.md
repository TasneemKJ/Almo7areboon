# Chapter scouting and village voice

**Goal:** Make preparing and returning from a battle more inviting through useful scouting and a distinct voice for each village.

**IDEAL:** Identify generic preparation/result copy; define truthful threats and chapter identity; explore rewards, ambient effects and scouting; act on scouting with village voice; look back through functional tests, Playwright screenshots and an independent bug audit. Retention uplift is a hypothesis, not an observed outcome.

**5 W's:** Who: new and returning players. What: prepare, deploy, regroup and revisit chapters. Where: the existing battle picker, ready guidance and result dialog. When: before and after combat, never an expanded live overlay. Why: understand the next threat and care about the place being defended.

**Design:** Bounded extension of existing presentation flows. `chapterScouting(chapter)` reads the real encounter schedule and returns opening count/time, a short warning for the first non-rush wave, and a troop counter. Six authored village voices provide brief victory/regroup lines, explicitly fictional flavour rather than simulated resident events. The picker exposes the selected opponent's scouting in a native details element; ready guidance teaches food and automatic combat before the first win, then names the opening wave; an optional, repeatable How a battle works disclosure explains counters, skills, pause and retry. Result flavour follows the existing outcome and uses the opponent chapter, even when the player's army has evolved elsewhere. No reward, save, timing or combat rule changes.

**Execution:** Native implementation with independent whole-branch review. User authorized autonomous brainstorm → plan → implement → Playwright → PR → review/audit → fix → merge cycles; routine design handoffs proceed within that authorization.

## Tasks

1. Write failing presentation tests for all six real openings, warning composition, invalid chapter fallback, distinct village voices, opponent/army mismatch, and mutation-free rendering. Implement the typed pure helper and wire existing picker, ready guidance and results. Add restrained paper/ink styling scoped to the new disclosure and quote. Run focused tests, full suite and build; commit.
2. Add a production Playwright capture to the existing mastery runner using its actual-action seeds and startup/session helpers. Check disclosure keyboard/scroll reachability, selected-opponent switching, ready/running behavior, victory/loss voice and save invariants at 320x568 and 390x844. Publish bounded scouting PNG/diagnostic evidence. Commit, publish a PR and run required CI.
3. Independently review all changes and audit state mismatch, stale copy, disclosure focus, mobile clipping and invented economic claims. Reproduce and fix important defects, rerun affected checks, merge only after required gates pass, and verify the deployed revision separately.

**Acceptance:** Actual schedule values; six distinct voices; opponent identity survives army evolution; no writes during disclosure; native keyboard access; no horizontal clipping or blocked action buttons; ready guidance replaced immediately during combat; all existing verification gates retained.

**Review focus:** Legacy receipts without statistics, cleared-but-lost rematches, evolved army against older opponents, narrow/short dialogs, session ownership and repeated rendering. Tests and native cases must deliberately exercise these.

**Rulings:** Use a sibling linked worktree in the authorized workspace so isolation adds no repository ignore/config change. Keep Playwright in GitHub Actions because local Chromium was previously unavailable; do not substitute DOM tests for native visual acceptance.
