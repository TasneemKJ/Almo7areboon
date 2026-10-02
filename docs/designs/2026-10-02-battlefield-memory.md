# Battlefield Remembers the Blow

Heavy blows and Meteor landings currently produce strong transient flashes, but the road is visually pristine again on the next frame. This bounded continuation lets resolved combat briefly mark the battlefield without changing combat or adding another interface.

## IDEAL

- **Intent:** Let the road remember consequential impacts long enough for the player to read where the clash happened.
- **Design:** A pure presentation model retains at most six marks for fourteen active presentation seconds. Positive heavy troop damage leaves a directional forked gouge; an accepted Meteor that lands on a real enemy leaves a cracked rosette. Nearby equivalent impacts on the same lane refresh instead of accumulating. Marks use the existing three depth-sorted ground graphics, fade only during their final four seconds, and remain static under reduced motion.
- **Evidence:** Tests first for truth, bounds, merging, expiry, malformed input, immutability, shape and reduced motion; renderer integration contracts; all source tests and production build; native Chromium at 320, 390 and 1024 in GitHub Actions; inspection of original screenshots.
- **Avoid:** No save field, reward, damage, target search, skill consumption, battle timing, input, economy, balance, audio, texture, new Phaser object pool or permanent terrain state.
- **Limits:** Automated Chromium evidence does not establish physical-device/Safari acceptance, subjective atmosphere quality, retention, low-end performance or organic combat comprehension.

## Five Ws

- **Who:** Every player whose heavy troop resolves positive unit damage, plus players casting an accepted Meteor; reduced-motion players receive the same information without animation.
- **What:** Up to six temporary ink-and-pigment road scars, differentiated by shape and faction direction/pigment.
- **When:** At the real visual landing of a resolved hit or Meteor. Marks age only while presentation is active, freeze under pause/hidden ownership, and clear on resize, retry, battle identity replacement and shutdown.
- **Where:** On the target lane's existing ground-effect plane, behind same-lane actors and clear of DOM HUD and objective surfaces.
- **Why:** Consequences that vanish instantly make the battle feel weightless. A short-lived trace makes the settlement road feel reactive without menu complexity or gameplay drift.

## Contract

`battlefieldMemoryIntentForHit` derives a mark only from a positive resolved heavy hit against a unit. Base hits already have structural base damage and are excluded. Normal-motion projectile marks wait for their existing projectile to land; direct heavy hits mark immediately. Meteor marks attach only to current enemy views selected by the accepted skill event, and a no-target visual fallback leaves no scar.

`rememberBattlefieldMark` sanitizes coordinates, refreshes equivalent marks within eighteen logical pixels on one lane and retains the newest six. `stepBattlefieldMemory` expires marks at fourteen active seconds and is byte-stable while paused. `battlefieldMemoryFrame` returns immutable relative geometry: three directional lines for heavy damage or one ellipse plus four cracks for Meteor. Normal motion holds alpha through ten seconds and fades for four; reduced motion holds the static composition until expiry.

Webdriver-only diagnostics expose count, cap, kinds, per-mark regions, reduced-motion and pause state. They do not change player-visible controls or production state and are cleared with the renderer lifecycle. The shared ground-effect depth is fixed two logical pixels behind each lane baseline, below the deepest `rankStagger` actor; the same relationship now protects existing dust and attack cues as well as the new scars.
