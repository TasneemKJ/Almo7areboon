# Portfolio source audit and iteration decisions — 2026-10-08

Base: ac2910163205f467248bec9e68632fd9bf650591. Source inspection and local regression evidence are distinct from deployed gameplay, whose SHA is unproven. The existing Levantine world, authored writing, rewards and save schema remain the design authority. No rule override is needed. Browser acceptance is pending coordination with the parent task.

### AM1 — Reach cover with Meteor

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: A touch player on the escort route has no living enemy yet; the existing cover-breaking skill needs a physical target on the cover. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Cover target
2. supplies Meteor
3. permanent skill bar
4. auto-break cover
5. delay cover
6. reuse enemy target
7. new cover icon
8. visible cover label
9. target cost
10. use canonical availability
11. preserve one-use rule
12. pause lock
13. keyboard equivalent
14. enemy priority
15. target focus return
16. no enemy-only Freeze
17. minimum44px
18. cover position match
19. used-state dismissal
20. narrative clue

Pick: Add a cover target at the painted landmark with Meteor only; dispatch stays authoritative.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.

### AM2 — Hear the gate's danger

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: A player under pressure needs the existing canonical urgent instruction to survive the world-first adapter. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Preserve danger cue
2. new danger bar
3. stronger gate flash
4. pause automatically
5. lower damage
6. emergency Food Drop
7. urgency priority
8. canonical tests
9. enemy cue delay
10. recruit ring
11. add warning sound
12. gate speech
13. captain plea
14. tutorial rewind
15. camera shake
16. reduced motion warning
17. contrast glyph
18. direct verb
19. avoid duplicate rules
20. retain quiet field cue

Pick: Preserve canonical gate-danger teaching in the existing physical cue, without a second health rule.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.

### AM3 — Read the mission in the field

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: A Chronicle player escorts or watches a landmark; the visible quiet cue should carry authored progress currently sent only to a hidden old panel. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Transfer canonical Chronicle guidance
2. permanent quest panel
3. marker tooltip
4. progress under cart
5. announce every percent
6. preserve danger priority
7. preserve first recruit
8. preserve skill teaching
9. quiet objective fallback
10. scout guidance
11. watch countdown
12. bell warning
13. lantern guidance
14. rally note
15. cart direction
16. mission title
17. mini map
18. longer prep tutorial
19. voice narration
20. show details link

Pick: Reuse canonical Chronicle progress in the one field cue after urgent/initial teaching, with no simulation rule duplication.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.

### AM4 — Explain the supplies choice

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: A touch player chooses a captain's support ability; the context should name the actual authored ability and teach the physical supplies target when helpful. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Actual captain skill name
2. Food Drop label
3. visible supplies cue
4. duplicate skill bar
5. show description in context
6. hide unavailable support
7. preserve disabled explanation
8. stable captain metadata helper
9. use existing skill label
10. rename captain
11. larger supplies chest
12. reveal label on selection
13. food-wait opportunity
14. danger support hint
15. support key hint
16. used badge
17. touch hover emulation
18. ability cost
19. preserve pause guard
20. no balance change

Pick: Use the existing skill cue to visibly name the support action and teach the supplies target at the canonical opportunity.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.

### AM5 — A useful next attempt

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: After defeat a player sees Regroup's three choices; one supported lesson should help the next attempt without opening the full receipt. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Canonical mastery advice
2. statistics summary
3. enemy damage chart
4. earlier chapter button
5. new upgrade panel
6. auto-upgrade
7. safer Retry label
8. keep earnings safety
9. retain three choices
10. keep Details
11. retain Home
12. loss-specific voice
13. victory recap
14. recommend exact spend
15. deploy timing hint
16. teach shelter
17. trophy progress
18. longer cutscene
19. blame-free phrasing
20. preserve result state

Pick: Keep three choices and safe earnings, adding the existing state-supported next-step advice to the compact result.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.

### AM6 — Quiet spoken guidance

IDEAL / 5Ws: identify the source-backed friction; define who/when/where as follows: A screen-reader player hears the field cue while food and mission seconds change; stable instructions should announce once, while visual progress remains current. Explore the twenty candidates below; act on the stated pick; look back through regression tests and exact-source browser review. This is a design-consistency fix, not a measured retention claim.

1. Stable live announcement
2. aria-live off everywhere
3. split visual and spoken cue
4. announce every countdown
5. announce milestones
6. strip progress numerals
7. semantic cue identity
8. retain urgent changes
9. hide visual cue from AT
10. keep accessible recruit labels
11. atomic region
12. test decrement sequence
13. test danger replacement
14. announce ready state
15. debounce timer
16. cooldown announcements
17. preserve pause silence
18. no new visible panel
19. describe support state
20. manual replay hint

Pick: Separate visual progress from stable semantic announcements. Announce a changed instruction/ready state, not each numeric decrement.

- [x] Implement and verify the bounded behavior in source contracts; native acceptance remains pending.


### AM7 — Verify the build that was started

IDEAL / 5Ws: identify a proven verifier ownership failure; define the reviewer starting a local browser review while another project already owns the fixed port. Explore twenty options, act on owned strict-port startup, and look back through a foreign-server regression. This improves release evidence; it is not a popularity or retention claim.

1. Strict preview port
2. Configurable review port
3. Configurable fixture port
4. Require the child's listening banner
5. Check the child after HTTP readiness
6. Stop a failed owned child
7. Preserve the foreign server
8. Avoid scanning neighboring ports
9. Share main/fixture startup
10. Reject invalid port values
11. Keep canonical preview command
12. Verify selected origin everywhere
13. Avoid merely checking response.ok
14. Test collision before browser launch
15. Keep logs bounded
16. Test a successful owned dev server
17. Add a manual port warning
18. Auto-kill the other server
19. Reuse whichever site responds
20. Launch browser before readiness

Pick: 1–16 form the bounded ownership repair. 17 adds no protection; 18–20 are rejected because they can interfere with another project or verify the wrong content. Reproduction against the actual existing capture-browser-review.mjs: a foreign server at4173 returned FOREIGN_BUILD_MARKER and the script proceeded to intercepted chromium.launch, before any browser opened. Result: {actualReviewScriptAcceptedForeignServer:true,browserLaunched:false}.

- [x] Use strict, configurable, owned startup for the review and its trait fixture.
- [x] Verify an occupied preview port leaves the foreign server alive and no browser launch occurs; the later fixture owns its port by the same helper.

## Verification and independent review

- Base is ac2910163205f467248bec9e68632fd9bf650591. The branch does not incorporate external PR186; its syncGates implementation is untouched. Expected integration overlap is import lines in field-controller.ts and nearby world-play.css target rules; preserve the user's gate-readiness work when reconciling.
- The original nine field/result regressions failed before implementation. The actual controller then passed the targeted continuity, food-piling, canonical skill-cue, support and compact-result tests. These run a narrow DOM boundary and real Game rules; they are not native touch or screen-reader tests.
- Independent source review confirmed that adding cover after enemy in the same stacking context could cover most of the first enemy's lane-zero contact region at390×844. The final bounded design exposes cover only with no living enemy; once any enemy is alive, its existing tactical menu supplies Meteor and Freeze. The handoff regression failed on the earlier implementation before becoming green.
- Origin-focused and immediately blurred cover cases reproduced focus loss when the enemy appeared. hideFieldTarget now remembers origin focus before hidden takes effect and returns it to visible Pause. A focused Meteor context uses the existing dismissal helper; a newer dialog keeps focus. All four cases pass.
- The preview collision was reproduced against the actual review script, with chromium.launch intercepted before any browser opened. The corrected script rejects an occupied chosen preview port, makes no readiness request to the foreign server, and leaves it alive. Normal owned dev-server startup/closure and invalid ports also pass. Both preview and later trait fixture use the same strict ownership helper; the fixture starts after browser launch.
- Full suite:1346/1347 passed. The only failure was the unchanged budget contract because this workspace's /tmp directory was absent. Rerunning with a task-local TMPDIR passed all12 nested checks. Five subsequent cover handoff/focus regressions also passed. The final focused amendment run passed23/23; all1352 test cases have passed across these runs. This is not a claim of one clean full-suite invocation at the amended head.
- TypeScript checked the entire src/tests tree. scripts/review-server.d.mts supplies an explicit typed API contract; no typecheck bypass was introduced.
- A separate reviewer executed11 pairs of current canonical Chronicle progress strings. Every visual string changed while fieldAnnouncement remained stable. Source review found no remaining Important/Critical findings or design-rule violations in the seven-iteration scope.
- Normal PR verification runs production build/typecheck and test:fast. Native browser/mobile reliability lives in separate weekly/manual workflows and is not silently inferred from PR CI.
- Exact-source native target geometry, touch/rotation,200%-text, screen-reader speech and visual acceptance remain pending. Local Chromium launches trap in this workspace; the cloud deployed build has unproven SHA. No browser-pass, deployment, popularity or measured-retention claim is made.

### Final build evidence

The final src/tests typecheck passed. Vite production compilation then passed into a new isolated output directory, followed by the unchanged aggregate checker:488902 gzip JavaScript bytes against512000. The repeated default dist output in this workspace retained prior hashed files and failed the aggregate check; increasing the budget or discounting duplicate shipped paths was rejected. The isolated build contains only current emitted files and uses the same Vite configuration, assets, service-worker assembly and checker. This verifies the final source build without treating stale local files as part of the candidate. No CI workflow or package-budget policy changed.
