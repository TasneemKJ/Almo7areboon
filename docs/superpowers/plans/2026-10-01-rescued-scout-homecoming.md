# Rescued Scout Homecoming

**Goal:** Make the existing four-second scout rescue read truthfully in the battlefield: the cage stays behind, the freed scout walks home, and the player can see rescue progress without opening another surface.

## IDEAL

- **Identify:** The rescue simulation already distinguishes a fixed cage, a four-second rescue, and a returning scout. The current renderer instead moves the same cage image toward home and communicates freedom only with a tint, so the visible story contradicts the objective text.
- **Discover:** Re-read the authoritative rescue tick/outcome, Chronicle renderer, depth rules, pause/reduced-motion contracts, PR126–128 regressions, and current release capture coverage. On 2026-10-01, the official Bad North press kit described tactical mastery as observing simulated soldiers' behavior, while the official Kingdom Two Crowns page tied minimalist strategy to recruiting and protecting visible subjects. The bounded inference is to show the existing person and journey directly; no competitor mechanic, code, or asset is copied.
- **Explore:** Considered stronger HUD copy, recoloring the cage, a new modal, a bespoke character painting, and reusing the existing age-matched ranged character art. More copy or a modal adds interface complexity; tint remains color-only; a bespoke actor risks style drift. Choose the existing illustrated character language, with small ink knots and footprints as secondary evidence.
- **Act:** Keep an emptied cage at the authored rescue point. Before freedom, paint four hand-inked progress knots from the sanitized real rescue counter. After freedom, render an age-matched player scout at the authoritative returning position, leave the cage visibly open and quiet, and add a bounded homeward footprint trail. Pause and reduced motion freeze all optional motion while keeping the composition informative.
- **Look back:** Prove fixed-cage/returning-scout separation, progress boundaries, malformed-state sanitation, foot-plane depth, pause/reduced-motion stability, no profile or simulation mutation, all source tests/build, native Chromium captures at 320/390/1024, original screenshot inspection, independent review, exact-tree merge, and production deployment.

## Five Ws

- **Who:** Players following the scout or missing-page rescue, including reduced-motion users and players reading a crowded phone-sized battle.
- **What:** A truthful two-part rescue scene using the existing cage and age-matched illustrated troop language, plus four progress knots and a small bounded footprint trail.
- **Where:** At the cage's fixed world position and the authoritative scout return position on the shared battlefield foot plane, behind HUD and objective surfaces.
- **When:** The cage and knots appear during the real four-second rescue. Once `rescued` is true, the cage remains open at the source and the scout travels home; pause/reduced motion keep the same static information.
- **Why:** Turn a text-only state transition into an observable homecoming, strengthening clarity and atmosphere without another control, menu, reward, or balance rule.

## Constraints

- No simulation, objective timing, damage, economy, reward, save schema, progression, input, or audio changes.
- Use only current state fields and existing illustrated unit textures; add no external asset or competitor material.
- Sanitize all numeric presentation input and hard-bound marks.
- Keep cage, scout, knots, and footprints on the shared ground-depth model.
- Native browser execution remains GitHub Actions only; disclosed fixtures are preparation states, not fabricated victories.

## Tests-first slices

1. Add a pure rescue-presentation test proving the cage stays at the authored point, progress produces zero-to-four literal knots, and the scout is absent before rescue.
2. Add failing cases for the freed scout at the authoritative return position, bounded footprints, malformed input, pause/reduced-motion stability, and immutability; implement the minimal pure frame.
3. Add renderer integration coverage for separate fixed cage and age-matched scout objects with foot-plane depth; integrate without changing simulation ownership.
4. Extend the existing Chronicle GitHub Actions review with disclosed pre/post-rescue current-build captures and unchanged-save/runtime assertions.
5. Run focused tests, all source tests, production build, focused and full GitHub Actions, original screenshot inspection, independent code/bug review, exact-tree merge verification, and Vercel production verification.

## Evidence boundaries

Source tests establish deterministic presentation contracts. GitHub Actions Chromium establishes the captured rendered states. Neither establishes physical-device/Safari acceptance, subjective atmosphere, organic comprehension, low-end performance, measured retention, or bug-free software.
