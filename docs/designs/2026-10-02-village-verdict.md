# Village Answers the Verdict

The existing survivor tableau makes each company acknowledge victory or defeat, but the painted settlement behind that company keeps the same residents and lamp state. This bounded continuation lets the village witness the already-authoritative terminal phase without changing that phase, delaying the result sheet, or adding another control.

Official references checked on 2026-10-02:

- https://kingdomthegame.com/kingdom-two-crowns/ — defended settlements and recruited subjects are part of the visible game fantasy.
- https://www.supergiantgames.com/blog/hades-updates/ — restrained crowd and supportive-shade reactions show how spectators can answer combat without another menu.

These references guide the principle only. The treatment remains original ink-and-pigment art built from Almo7areboon's measured apertures and existing light pool.

## IDEAL

- **Intent:** Make a won or lost battle feel consequential to the home behind the army, not only to the surviving troops in front of it.
- **Design:** A pure verdict model derives a bounded `celebrate` or `shelter` response from the real terminal phase. It is complete on the first authoritative terminal frame, so a slow renderer cannot let the unchanged wall-clock result sheet cover an unfinished reaction. Victory returns silhouettes to each HUD-clear registered window and adds short upward acknowledgement strokes; defeat clears silhouettes and crosses those same clear windows with shutter strokes. Only HUD-clear procedural light overlays brighten or dim. Both outcomes remain readable by shape rather than colour alone.
- **Evidence:** Tests first for truth, timing, malformed inputs, bounds, immutability and reset; renderer/source integration tests; all source tests and production build; native Chromium at 320, 390 and 1024 in GitHub Actions; inspection of original current-build screenshots.
- **Avoid:** No save field, reward, battle timing, result timing, dialog, input, economy, balance, target, audio cue, new texture, new game object or permanent restoration change.
- **Limits:** Automated software-rendered Chromium and source tests do not establish physical-device/Safari acceptance, subjective atmosphere quality, organic comprehension, retention or low-end performance.

## Five Ws

- **Who:** Every player reaching a real win or loss, including reduced-motion users and profiles with or without Chronicle restoration.
- **What:** A transient, presentation-only village verdict using the two measured chapter apertures, the existing ambience graphics layer and the existing six pooled light quads.
- **When:** On the first authoritative terminal frame of the established pre-result survivor tableau. It disappears immediately when a new ready battle identity replaces the terminal state. Terminal phases do not acquire a new pause owner; the existing running-only pause and unchanged result delay remain authoritative.
- **Where:** Inside and immediately around the actual registered village windows, behind bases and troops and outside HUD/control surfaces.
- **Why:** The settlement is the thing being defended. Letting it visibly answer the outcome closes a current world-state contradiction and adds life without adding interface complexity.

## Contract

`villageVerdictFrame(input)` accepts the authoritative phase plus the shared presentation inputs. It returns `null` outside `won`/`lost`; otherwise it returns an immutable complete mode on the first terminal frame. Reduced motion uses the same stable complete composition. The elapsed field remains accepted at the renderer seam but cannot delay or manufacture an outcome.

`villageFrame(input)` consumes that optional verdict. A win replaces ordinary occupancy in HUD-clear apertures with at most two returning witness silhouettes and at most six upward acknowledgement strokes. A loss returns no verdict witness and paints two crossed-shutter strokes per HUD-clear aperture, up to four. A HUD-overlapped aperture retains its ordinary occupancy and alarm shading instead of being silently emptied; those preserved residents are not counted as verdict evidence. Authored/restoration light descriptions are attenuated or brightened only when their halo is HUD-clear, and are never mutated. All geometry derives from `VILLAGE_PLATES` and remains within the existing fixed pools.

The webdriver-only canvas diagnostic reports mode, progress, verdict-witness count, stroke count, total light count, affected-light count, pause and reduced-motion state. Its measured regions cover every verdict-created witness polygon, verdict stroke and verdict-affected light separately, avoiding both empty-space union collisions and false claims about unchanged HUD-overlapped marks. It is absent in ready/running play and cleared on scene shutdown. Native victory capture waits for the existing camera flash to finish so the evidence shows the reaction, starts the full-stage screenshot as soon as that post-render frame is ready, then transfers and probes the stored canvas PNG; the reaction itself is still complete on the first terminal frame.

## Acceptance

1. Only real `won` and `lost` phases produce a village verdict.
2. Without HUD occlusion, a win produces two measured witnesses plus distinct upward strokes and a loss produces no witnesses plus crossed shutter strokes; measured HUD overlap suppresses only the affected aperture/halo.
3. Result reaction cannot change battle state, profile, storage, rewards, result delay or restoration.
4. The verdict does not change existing running-only pause ownership; reduced motion uses a stable complete composition.
5. Malformed time, phase, restoration and geometry inputs remain finite, immutable and bounded.
6. The renderer allocates no new scene-lifetime object pool and clears diagnostics on retry, identity replacement and shutdown.
7. Native 320/390/1024 same-frame canvas and full-stage screenshots show the response after any terminal camera flash and before the unchanged result sheet; per-primitive DOM rectangles establish HUD clearance, and a separate reduced-motion journey establishes a stable complete composition.
