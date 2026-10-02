# Survivor Verdicts

**Goal:** Let the surviving company visibly answer a real battle result during the existing battlefield-to-result transition, without changing combat, rewards, timing, or controls.

## IDEAL

- **Identify:** Exact-main native evidence shows anticipation, attacks, landmark pressure, rescues, and base damage all animate in-world, but the surviving actors return to an ordinary idle frame as soon as the outcome settles. The battlefield therefore becomes least alive at its most consequential moment, during the existing result-sheet delay.
- **Discover:** Re-read the exact-tree simulation result boundary, renderer lifetime, character gesture and pose contracts, result timing, reduced-motion handling, save/session ownership, Chronicle mission outcomes, and current 320/390/1024 Chromium originals on 2026-10-01. The official Kingdom site describes a minimalist side-scrolling strategy experience whose subjects, defenses, and threats live inside the world; the bounded design inference is to let Almo7areboon's existing survivors express its own authoritative outcome in-place. No competitor mechanic, code, copy, or asset is copied.
- **Explore:** Considered only shortening the frozen interval, adding another result heading, a large celebration particle burst, moving units all the way home, and a survivor tableau. Text repeats the result sheet, more particles add noise, and simulated travel could misrepresent targeting. Choose a small role-specific tableau: winners hold a distinct victory silhouette; defeated survivors turn toward their own gate with a bounded homeward step.
- **Act:** Add a pure finite pose model keyed only by terminal phase, unit side, role, elapsed presentation time, and reduced motion. The Phaser renderer observes the existing `win`/`lose` event, applies the model to surviving actors during the already-authored result delay, exposes bounded diagnostics for native verification, and clears the state on every new battle or renderer replacement.
- **Look back:** Prove phase/side/role truth, finite bounds, reduced-motion stability, pause/visibility ownership, restore/reset cleanup, and zero model mutation test-first; run all source tests and the production build; execute native Chromium only in GitHub Actions; inspect original mobile and desktop screenshots; obtain independent code review and bug audit; then verify the exact reviewed tree, merge, and independently verify production.

## Five Ws

- **Who:** Players watching the battle resolve, including reduced-motion, muted, touch, keyboard, and colour-vision players.
- **What:** A short, role-specific survivor tableau driven by the real terminal outcome: the winning side triumphs and the defeated side faces home.
- **Where:** On the existing battlefield actors at their current lane positions, behind the current HUD and result sheet.
- **When:** Only after a fresh `win` or `lose` event and before the existing result sheet covers the field. It clears on ready/running state, retry, next battle, import/reset, scene replacement, and shutdown.
- **Why:** The game already makes threats and tactics visible in the world; survivors should also make the outcome legible and emotionally responsive without adding menu complexity.

## Guardrails

- Preserve result timing, outcome authority, unit positions, targeting, health, rewards, economy, mastery, Chronicle receipts, saves, input, pause ownership, audio, and all existing effects.
- Consume only the terminal event and read-only unit presentation fields. Do not dispatch an action, step the simulation, mutate a unit, or add a save field.
- Use the existing actor objects and sprite frames. Add no image, texture, emitter, listener, DOM control, live region, or per-frame game object.
- Winner/defeated and melee/ranged/heavy states must differ by pose geometry or facing, not pigment alone.
- Full motion may use at most four world pixels of translation, four degrees of rotation, and four percent scale change. Reduced motion is a fixed zero-translation pose.
- Sanitize phase, side, kind, and elapsed time; every returned number must be finite and bounded.
- The tableau lifetime follows the renderer's existing presentation clock. Paused/hidden owners cannot advance it, and a restored terminal save does not fabricate a fresh celebration.
- Browser execution remains GitHub Actions only. Prepared profiles are disclosed setup fixtures; native screenshots prove presentation execution, not organic balance, human comprehension, retention, physical-device/Safari acceptance, listening quality, or low-end performance.

## Acceptance

1. Nonterminal phases and terminal states without a fresh outcome event produce no tableau.
2. A fresh win marks player survivors as winners and enemy survivors as defeated; a fresh loss reverses those roles.
3. Melee, ranged, and heavy winner silhouettes are pairwise distinct; defeated survivors face their own gate and move no more than four pixels.
4. Reduced motion produces the same fixed pose for any equivalent input time and never translates an actor.
5. Malformed kinds, sides, phases, and elapsed values return a safe finite pose or no pose.
6. Phaser reuses current actors, reports phase/elapsed/role counts and bounds in `canvas.dataset.battleAftermath`, deletes the dataset outside a fresh terminal transition, and performs no model or save write.
7. GitHub Actions Chromium reaches real public-action victory and defeat outcomes, captures the uncovered tableau at 320, 390, and 1024 widths before the unchanged result sheet, and reports no runtime, asset, overflow, or ownership failures.
