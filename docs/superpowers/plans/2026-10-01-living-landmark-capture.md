# Living Landmark Capture

**Goal:** Make every capturable Chronicle landmark explain its real claim progress and contested state on the battlefield, without adding controls or changing simulation.

## IDEAL

- **Identify:** Current main draws only a static ownership ellipse around cover, supply, and lantern landmarks. The capture simulation already distinguishes friendly-only, enemy-only, contested, owned, and broken states, but none of that transition is visible until ownership flips. The light-objective guidance also begins counting the post-capture 18-second hold before explaining how to claim the lantern.
- **Discover:** Re-read the exact-tree combat contract, Chronicle view, guidance precedence, presentation tests, mobile evidence, progression design, and PR125–131 regressions on 2026-10-01. Bad North and Kingdom Two Crowns both describe tactical depth that remains legible through direct battlefield observation and simple controls; the bounded inference is to expose Almo7areboon's existing state, not copy mechanics, code, or assets.
- **Explore:** Considered a tutorial modal, floating numbers, a HUD meter, changing capture timing, and a ground-registered storybook seal. A modal or HUD adds interaction and layering cost; floating text competes with combat; retiming is unsupported balance work. Choose a bounded ink-and-pigment ground seal generated from the same authoritative query used by simulation and guidance.
- **Act:** Add one sanitized landmark-status query for threshold, presence, direction, progress, ownership, contest, and breakage. Use it in `chronicleTick`, contextual guidance, and a pure view model. Paint continuous olive knots for player pressure, separated clay stitches for enemy pressure, crossed marks for contest, and severed gaps for breakage beneath the landmark and all actors.
- **Look back:** Prove parity and malformed-state safety test-first; run focused and all source tests plus production build; execute native Chromium only in GitHub Actions; inspect original 320/390/1024 screenshots; obtain independent code review and bug audit; then verify the exact reviewed tree, merge, and independently verify production.

## Five Ws

- **Who:** Players reading crowded Chronicle battles, including colour-vision, sound-off, reduced-motion, keyboard, and touch players.
- **What:** A truthful landmark claim seal and contextual capture guidance for neutral, friendly, enemy, contested, owned, and broken states.
- **Where:** On the battlefield foot plane around the existing cover, supply, or lantern prop, plus the existing objective-guidance line; no new menu, button, overlay, or save field.
- **When:** Whenever an enabled Chronicle battle contains a landmark. The seal changes only when authoritative battle state changes and remains static while paused or under reduced motion.
- **Why:** Landmark ownership materially changes cover, supply, healing, reveal, and victory behavior, so players should be able to understand and intentionally contest that state before it flips.

## Guardrails

- Preserve the existing 85-unit presence radius, three-second threshold, four-second unlit-lantern threshold, owner transitions, light timer, rewards, damage, targeting, and cue timing exactly.
- No combat, economy, progression, reward, save schema, input, pause, audio, or animation change.
- Presentation consumes a finite sanitized status contract; malformed numbers cannot create NaN geometry or misleading progress.
- Player and enemy pressure differ by both pigment and geometry. Contested and broken states are not encoded by colour alone.
- The seal uses a dedicated ground graphics layer below the prop and actors and does not enter the HUD/objective surface.
- Reduced motion and pause are static by construction. Sound remains optional and is not required to read ownership.
- Browser execution remains GitHub Actions only. Screenshots and deterministic fixtures are disclosed presentation evidence, not proof of human comprehension, balance, retention, physical-device/Safari acceptance, or low-end performance.

## Tests-first slices

1. Add failing combat tests for neutral/friendly/enemy/contested/owned/broken telemetry, exact threshold parity, finite malformed inputs, and tick ownership transitions.
2. Add failing guidance tests for approach, active claiming, contested pressure, and the existing post-capture lantern hold.
3. Add failing pure view-model tests for bounded geometry, side-specific shapes, contest/breakage, static output, and depth planning.
4. Implement the authoritative status query, refactor capture simulation to consume it, add the pure render frame, and paint it on a dedicated ground layer with a diagnostic dataset for native verification.
5. Extend the focused GitHub Actions journey with disclosed landmark states and original mobile screenshots; run all required release gates, independent review, exact-tree merge verification, and production verification.

## Evidence boundaries

Source tests establish deterministic query, geometry, guidance, and simulation contracts. GitHub Actions Chromium establishes actual browser execution and original screenshots at the captured viewport sizes. Neither establishes organic comprehension, subjective visual quality, balance, retention, physical-device/Safari acceptance, or low-end performance.
