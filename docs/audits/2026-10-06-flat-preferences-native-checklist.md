# Exact-candidate native checklist (not yet executed)

This slice has no native/browser/screenshot evidence. Verify the frozen candidate, not an older published head. The inherited broad browser suites contain stale old Settings-button and one-step-retreat selectors and are not substitutes for these transitions.

## Required viewports and input
320×568, 360×640, 390×844, 412×915 portrait; 844×390 landscape; 1280×800 desktop; touch at DPR 2–3, rotate, hidden-tab return, reduced motion, keyboard, 200% root type, accessible labels and visible focus. Capture and inspect actual screenshots before publication. Check bounded 4×CPU separately; no physical-device/Safari claim from source checks.

## State/action matrix
1. Empty storage → Home: Play / Settings only. Opening/changing Preferences must not create prior-play history. Reload remains Play / Settings.
2. Play → accepted canonical start: played=true, physical field retained and original first recruit cost. Pause: Resume / Settings / Home. No background field target receives modal input.
3. Pause → Preferences: 7 native fields, 3 buttons, no close icon or disclosure tree. Toggle/check/select all fields by pointer and keyboard. Nodes retain focus, switches and mixes remain independent, muted range changes make no sound. Done returns to Pause Settings; Resume alone releases pause.
4. Preferences → Save & recovery: Export / Import / Back. Back returns to the owning Save & recovery button. Temporary mode Export remains available, Import and Start over disabled; warning visible.
5. Start over: Export / Delete progress / Keep progress. Cancel and Escape restore Preferences Start over; confirmation writes only with the active writer and returns fresh Play Home. Existing daily/grace-day anti-repeat policy and sound/speed/motion/marks survive.
6. Import: bounded valid file → Replace / Cancel, no extra close icon. Cancel/Escape return to Save & recovery Import. Late read after exit or a newer selection cannot open a stale confirmation. Successful import returns Home; failed write keeps current state.
7. Active battle → Pause → Home: Continue / Leave battle… / Settings. Continue resumes same troops/time/food, no Start dispatched. Leave → explicit loss/kept-coins/current-troops consequence → Keep or Leave for Camp. Cancel keeps the held battle. Confirm dispatches retreat/retry then displays ready Camp with no clock/wave start.
8. Ready returning save (played flag or old deployed/kills/wins history): Continue / Camp / Settings. Camp is noncombat, supports existing advanced screens and Home returns without an extra overlaid preparation button. Start from Camp restores physical field.
9. Held normal victory, defeat and expedition provision: Continue / Settings only. Camp cannot be exposed or synthetically bypass receipt/provision. Continue opens the canonical result; both supplies/shelter remain explicit, unchanged reward settlement.
10. Writer conflict/future/unavailable and quota: recovery stays authoritative during field changes, leave-step persistence, import/reset and Escape/Back. Save failure is durable beside Preferences fields. Normal profile/schema/backup protection remains unchanged.

## Stable selector map
- #entry-play, #entry-secondary, #entry-settings (secondary hidden when unavailable)
- [data-command="field-pause"] → [data-command="home"]
- [data-command="leave-battle"] → [data-command="confirm-leave-battle"] or [data-command="close"]
- [data-command="home-camp"], Camp #field-return now means Home
- #preference-sound, #preference-atmosphere, #preference-marks: native checkboxes
- #effects-volume, #atmosphere-volume: existing native ranges
- #preference-speed (1/2), #preference-motion (system/reduced): native selects
- [data-command="save-recovery"] → Export / Import / Back
- #preference-status: durable saving/temporary notice

Existing dense Camp and result Details are still separate all-screen redesign debt. Do not report this candidate as whole-game simplicity acceptance.

## Inherited native blocker reported by parent
The parent’s exact-base 27917fe2 native run passed both 120-second journeys, the 320/844 temporary notice and three physical role markers, then reproduced an existing dense Camp failure at 320×568: food upgrade spans y528–572, leaving only 40px effective height and covered touch points under bottom navigation. This is evidence for that base, not this candidate. The parent retains the original capture at workflow-review-prep/almo-notice-320-originals/candidate-320x568-failure.png. The blocker remains open and prevents treating Camp or the whole PR as accepted. Do not hide the upgrade, relax 44px or bypass the real action; Camp needs its separate substantial redesign.
