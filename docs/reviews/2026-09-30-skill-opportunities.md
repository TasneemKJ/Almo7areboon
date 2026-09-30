# Skill opportunities review

Plan: `docs/superpowers/plans/2026-09-30-skill-opportunities.md`.

The independent read-only whole-branch audit found no Critical or Important source issue. It checked authoritative availability, state/pause/save boundaries, living-target counts, active legacy Freeze timing, stable native nodes, no new motion and no persistence/combat/economy changes. Four focused cue tests and the affected main-function integration tests passed; additional independent probes covered legacy ranks, retreat during Freeze, retry and food caps without presentation writes.

One minor evidence issue was addressed within the required Playwright gate: a 700ms wait could miss continued time behind a whole-second rounded badge. The gate now observes the actual paused button/banner and compares the countdown after 1200ms. This strengthens the acceptance requirement and changes no production behavior.

Local branch-base suite: 608 tests pass; production build passes, with the existing large Phaser chunk warning. Native acceptance covers 320x568, 390x844 and 320 forced colours with reduced motion; actual three-enemy arrival, native keyboard focus, Freeze consumption/countdown/pause, visible control bounds, spent state and retreat/retry reset. Required existing CI checks stay enabled.

Before merge, reconcile PR111 into the branch, run combined verification and inspect original native screenshots. Source review cannot establish rendered focus/contrast, mobile clipping, screen-reader announcements, deployed revision or retention lift.
