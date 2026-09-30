# Skill opportunities and self-teaching

Goal: help players recognize skill timing through the existing buttons, without adding another battlefield panel.

IDEAL: identify opaque one-use icons; define truthful target and active-effect feedback; explore reminders, forced tutorials and in-place cues; anticipate accidental spending, pause and stale-target risks, then act on in-place cues; look back through public-action tests, Playwright and independent review.

5 W's: new and returning players choose Freeze/Meteor/Food Drop, on existing battlefield controls, while enemies gather or a freeze is active, to make deliberate decisions and learn through immediate feedback.

Bounded design: a pure skill cue reads living enemy counts, used state, phase/pause and the authoritative availability result. Unused Freeze/Meteor show the living target count; three or more targets get a static brass border. Freeze states that it starts immediately. During an active Freeze the badge shows remaining battle seconds, including while paused, then a spent mark. Food keeps its up-to-10 badge and full-storage explanation. All buttons keep their native nodes, action IDs and availability. Names and titles explain visible information without countdown live announcements. No reward, save, timing, combat or sound changes.

Execution: native, with fresh independent whole-branch review; user authorized autonomous iteration cycles. Keep this branch separate while PR111 finishes; merge only after the scouting iteration and combined verification pass.

Tasks:
1. Public-action RED tests cover zero/three targets, Freeze starts immediately and countdown, pauses, spent skills, terminal phases, capped food, ally/dead exclusion and no mutation. Implement `skillCue(profile,state,skill,available)` and wire stable badges/names/static opportunity styling. Run full tests/build; commit.
2. Production Playwright checks initial empty Freeze, real three-enemy opening, native focus retention, Freeze activation/countdown, manual pause and restart clearing cues at 320/390. Use actual game input and screenshot evidence, not test globals or outcome injection. Keep all existing CI gates. Publish PR after reconciling the latest main.
3. Independent review and bug audit; fix important findings with regressions; inspect native captures and merge verified head. Confirm deployment separately.

Acceptance/review focus: actual living targets rather than future/ally/dead units; no availability change; useful cues suppressed while paused/results; freeze uses battle clock and legacy duration; visual cue is static under reduced motion and available in forced colours; stable focus and mobile 44px controls; no claims of guaranteed kills or retention uplift.
