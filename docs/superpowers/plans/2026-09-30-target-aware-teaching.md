# Teach useful skill timing

IDEAL: identify a contradictory live tutorial; define useful, available suggestions; explore changing combat availability versus changing contextual teaching; act on the teaching hint; look back through actual battles, browser captures and independent review.

5 W's: new players choose a once-per-battle skill on existing battlefield controls, after the opening deployments and between waves, to learn timing without wasting Freeze or trying disabled Meteor.

Reproduction: start the opening chapter and deploy the first three melee warriors as food becomes available. At about 29.33 battle seconds, no enemy remains and the next wave is over eight seconds away. The old hint recommends Freeze and Meteor. Freeze can expire before any enemy arrives; Meteor is disabled.

Bounded design: retain all combat rules and priority messages. The occasional skill tutorial names unused Freeze/Meteor only with a living enemy, and unused Food Drop only below the real 99-food capacity. If no useful skill exists, normal encounter guidance continues. No panel, persistence or new currency.

Verification: simulation-backed RED/GREEN checks cover the real quiet interval and subsequent living enemies, full food, pause and mutation-free rendering. Existing interface tests remain required. The native 320px case uses three actual troop clicks, captures the empty-target hint, verifies disabled Meteor and zero Freeze targets while paused, then resumes to verify combat suggestions with living enemies. It joins the existing mobile and forced-colour skill gate. All release gates remain required.

Independent read-only source review found no Critical or Important defect. Browser stability and rendered evidence remain acceptance requirements. This is a correction to teaching, not evidence of a measured retention gain.
