# Changelog

Semantic versioning. Each merged batch adds an entry; `package.json` and the top heading carry the same version (a test checks). Git tags are cut by the maintainer at release time (only `v0.2.0` exists).

## 0.3.14 - 2026-10-06
- Weekly goal edge closed: a battle that starts in a new week opens it first, and a win that is the first thing seen in a new week counts the seals it just settled (they were earned this week) instead of making them the base.
- Docs pass: UX-CONTRACT describes the shipped dialog header, cues, preferences and goals; TODO ticks what shipped and keeps open items honest; `package-lock.json` carries the package version; a test pins package, lock and changelog versions together.

## 0.3.13 - 2026-10-06
- Weekly goal in Quests: earn 3 new mastery seals within a Monday-to-Sunday week for 60 gems, once per week. Optional, normalized `weekly {week, baseSeals, claimed}` profile field; progress is the rise in the seal total since the week was first seen (synced at load, when Quests opens and on a win), so seals earned before the week do not count and a timeline reset rebases instead of going negative. Start over keeps it, so a reset cannot reopen a claimed week.
- Freeze and Meteor badges that show a bare number (the count of living enemies) gain a small target ring so they no longer read as a countdown. Style only; the badge text and labels are unchanged.

## 0.3.12 - 2026-10-06
- Food-piling cue: in the first three wins, a player who deployed once and banks food for three or more warriors with fewer than three fighting sees "Food is piling up (N). Keep tapping the melee card to send more warriors." and the first card gets the teaching ring again. It outranks the skill cues. Found by a scripted first-timer run (docs/audits/2026-10-06-round10-first-timer.md).

## 0.3.11 - 2026-10-06
- Hit-stop: a heavy blow on a unit freezes the scene for about 50 ms (at most twice a second); never with reduced motion. Webdriver-only `canvas.dataset.hitStops` counts them for browser checks.
- `lastSeen` is rounded to the minute, which removes a rare flake where two back-to-back saves differed by a millisecond.

## 0.3.10 - 2026-10-06
- Welcome-back line: after six hours or more away, a returning player sees "Welcome back. The village kept the lamps lit for 3 days." (grants nothing). Stored as an optional, normalized `lastSeen` written on the saved copy only.
- Webdriver-only `canvas.dataset.lastDeath` hook so browser checks can find a heavy death.

## 0.3.9 - 2026-10-06
- Settings shows when the game last saved (kept in memory for this visit; nothing new is stored).
- Short-landscape dialogs: the close button no longer floats over scrolled controls (0.3.3 regression). The 44px header stays sticky and opaque, with the title pulled up into the same row.
- Heavy troops fall louder: wider dust, a second ring and a short low shake (no shake with reduced motion). Death events now carry the fallen role.

## 0.3.8 - 2026-10-06
- First battle ever: the Light Guard card gets a gold teaching ring until the first deployment (pulses only when motion is full; static ring otherwise).
- A test now locks the result motifs: victory rises, defeat falls.

## 0.3.7 - 2026-10-05
- Streak grace day: one missed day keeps a daily-reward streak of two or more, at most once every seven days; the Quests row says so before claiming. Stored as an optional `graceDay` profile field, normalized on load and kept by Start over.

## 0.3.6 - 2026-10-05
- Settings: "Troop shapes" (off by default). Cards and the battlefield mark roles with a circle (melee), triangle (ranged) or square (heavy); filled shapes are yours, outlined are the enemy. Stored as an optional `marks: true` profile field, normalized on load, kept by Start over.

## 0.3.5 - 2026-10-05
- Defeat recap: the result names the troop role that dealt the most damage and its share. Battle stats gain an optional, normalized `damageByKind` (older saves and receipts simply omit it).

## 0.3.4 - 2026-10-05
- First-Meteor cue: after Freeze is used, when three enemies gather, the deploy hint points at Meteor (first five wins only).

## 0.3.3 - 2026-10-05
- Short-landscape dialogs (Settings, Quests, Journey): the close button floats top-right on an opaque tile and the title starts at the top, removing the empty band of about 70px.
- The result's battle earnings count up over 0.8 s (static with reduced motion; the full total stays in the accessible label).

## 0.3.2 - 2026-10-05
- First-Freeze cue: when three enemies gather and Freeze is unused, the deploy hint says so (first five wins only).
- Evolving plays a one-shot flare across the new army's cards (static with reduced motion).

## First Fires depth — merged between 0.3.2 and 0.3.3 without a version bump
- First Fires gains two source-registered distant-air pockets and two masonry reflections on the existing ambience layer, with static reduced motion and bounded cached geometry.
- Its original soundscape gains restrained near-hearth and distant-valley separation without adding an audio voice or changing other chapters.
- Source tests and build are verified; exact-payload native-render, listening and physical-device acceptance remain separate release gates.

## 0.3.1 - 2026-10-05
- The incoming-wave label moved out of the lane into the sky band under the title (it covered the marching army at 320x568 and in landscape).
- Dialogs in short landscape lose the empty header band.

## 0.3.0 - 2026-10-05
- Landscape phones: side rail layout; the battlefield stays in view while deploying.
- Portrait: Gather has its own space; tall phones no longer push upgrades under the navigation.
- Phaser loads after the shell (app chunk 356 kB to 233 kB).
- Share preview image and metadata; result screen states seal requirements once and names the next reward.
- Touch check script; actions v7 in every workflow; Dependabot ignores breaking majors.

## 0.2.0 - 2026-10-05
- Ready screen: the Journey button names the nearest reward (daily reward, claimable milestone, closest milestone).
- Dialog titles no longer show a boxed focus outline after pointer or programmatic focus.
- CI: fast `verify` gate (build plus quick unit tests); heavy suites are manual and run weekly; failure-only trimmed evidence; actions moved to v7; Dependabot (monthly, grouped).
- Docs: agent workflow set (AGENTS, CLAUDE, ARCHITECTURE, DESIGN_RULES, TODO, NEXT_ITERATION_PROMPT), CREDITS, performance budgets.

## 0.1.0
- Initial playable release (see `docs/ITERATIONS.md`).
