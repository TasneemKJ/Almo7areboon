# Flat preferences and honest Home ownership

## Approved change contract
This local-only source slice implements the approved seven-field Preferences panel, three-action save surface, Pause → Home, and guarded noncombat Camp entry. It retains the storybook paper/navy/brass visual system. No browser, native capture, server, publication or GitHub writes are authorized in this worker. These are source findings and a design plan, not a Product Design visual audit or all-screen acceptance.

## 5Ws and IDEAL
- Who: phone-first short-session players, including returning players with advanced progress and keyboard/reduced-motion users.
- What: choose independent sound, atmosphere, mix, speed, motion and troop-shape preferences without a catalogue; return to preparation without accidentally starting or losing a battle.
- When: Home, paused combat and deliberate save recovery.
- Where: the existing authored game and paper dialogs, preserving native controls and existing simulation/session owners.
- Why: the former Settings combined nine buttons, two sliders, two disclosures and destructive/recovery actions, while Camp held a live battle instead of owning ready preparation.
- Identify: Settings combines unrelated tasks and Home treats a mere persisted preference as prior play.
- Define: seven honest fields plus Save & recovery / Start over… / Done; each focused auxiliary surface at most three buttons. Home is fresh 2, returning-ready 3, held-running 3, receipt 2.
- Explore: twenty candidates below; choose the narrow set authorized by the parent.
- Act: test the public handlers and canonical simulation before implementation; keep mutation guards and explicit consequence confirmations.
- Look back: full unit suite/build and engine-inclusive 500 KiB gzip gate; exact-source touch, screenshot, focus/rotation and listening acceptance remains pending.

## Twenty candidates
1. Flat sound checkbox (selected; audio/clarity).
2. Independent atmosphere checkbox (selected; atmosphere/saved intent).
3. Separate effects range with numeric output (selected; audio/accessibility).
4. Separate atmosphere range with numeric output (selected; audio/accessibility).
5. Native battle-speed selector (selected; game feel/input).
6. Native reduced/system motion selector (selected; accessibility).
7. Optional troop-shape checkbox with textual role legend (selected; combat clarity).
8. Save & recovery as one focused surface (selected; data safety).
9. Explicit Start over entry and consequence text (selected; data safety).
10. Backup Export / Import / Back only (selected; UI simplicity).
11. Preserve import read-race invalidation under the new owner (selected; stability).
12. Make Done return to Pause when opened there (selected; session design).
13. Pause Resume / Settings / Home (selected; navigation).
14. Home Camp only after actual prior battle entry (selected; onboarding).
15. Mark first accepted Start optionally in schema 5 (selected; honest returning state).
16. Keep Camp visit at ready phase with zero clock/waves (selected; pacing).
17. Separate Leave battle confirmation with kept-coins/loss disclosure (selected; progression).
18. Give held victory/provisions precedence over Camp (selected; earned-state safety).
19. Rebuild the dense Camp as physical preparation locations (deferred; separate scope).
20. Move result Details progression catalogue to focused owners (deferred; separate scope).

## Access map and invariants
Fresh Home: Play / Settings. Returning ready Home: Continue / Camp / Settings. Held running Home: Continue / Leave battle… / Settings. Terminal or pending victory/provision: Continue / Settings only; Continue retains canonical receipt choices. Camp starts neither timer nor combat and remains the existing dense preparation UI, explicitly unresolved debt. Leaving a live battle confirms ordinary defeat then uses canonical retreat and retry before Camp; any session ownership loss interrupts this sequence. Settings Done returns to Pause or the unchanged originating Home/Camp; save and reset/import cancellation return to their parent surface. No rendering grants, balance changes, new audio presets or write bypasses.

## Review limitations
No new screenshot was captured or inspected here. Mobile layout, actual target geometry, native select behavior, short landscape, focus restoration, real keyboard/touch and screen-reader flow need native verification on the final candidate. The inherited external review tree was copied without modification. No assertion of whole-game simplicity is made.

## Parent native finding retained as a blocker
On published base 27917fe2, the parent reports a 320×568 Camp food-upgrade collision with bottom navigation: y528–572 produces only 40px effective height with covered touch points. This predates this source delta and remains unresolved. This batch deliberately preserves the upgrade and its real cost; no target threshold is relaxed. See the native checklist for provenance and the required next Camp redesign. Passing source tests does not accept Camp or publication.
