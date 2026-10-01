# Incoming Road Signs

**Goal:** Let players read an imminent authored enemy wave in the battlefield itself before its first warrior appears, without changing the schedule or adding a control.

## IDEAL

- **Identify:** Current main exposes exact wave intent, roles, and time in the DOM HUD, but the rendered road gives no advance consequence: enemies appear at the gate on the scheduled frame and only then make movement dust. This leaves a reactive, atmospheric battlefield behaving like a detached display beneath an otherwise truthful HUD.
- **Discover:** Re-read the exact-tree encounter schedule, Chronicle commander variations, wave HUD, Phaser depth model, recent mobile evidence, and PR119/126–132 regressions on 2026-10-01. The official Kingdom pages describe atmospheric minimalist strategy in which threats, subjects, and defense live in the same world; the bounded inference is to let Almo7areboon's own authored approach become visible in its road. No competitor mechanic, code, or asset is copied.
- **Explore:** Considered another help panel, countdown text, a sound-only warning, screen-edge flashes, and storybook road signs. Panels/text repeat existing UI, audio excludes mute players, and a flash is abstract. Choose a small ink-and-pigment road omen at the enemy gate: intent-specific banner geometry, one shape per scheduled role, and four countdown knots, all driven by the existing `WaveStatus.preview`.
- **Act:** Add one finite pure view model for the last four battle seconds before each wave. Paint a swallowtail for rush, a split pennant for volley, or a square weighted cloth for bulwark; show melee footprints, ranged sling-stitches, and heavy block-treads beneath it. Put the dedicated graphics object behind bases and actors, expose a diagnostic dataset for native verification, and make pause/reduced-motion static without adding a clock.
- **Look back:** Prove exact schedule parity, malformed-input bounds, role/intent shape distinctions, phase and pause gates, fixed depth, and no model mutation test-first; run all source tests and production build; execute native Chromium only in GitHub Actions; inspect original 320/390/1024 screenshots; obtain independent code review and bug audit; then verify the exact reviewed tree, merge, and independently verify production.

## Five Ws

- **Who:** Players tracking the next enemy arrival, including colour-vision, mute, reduced-motion, keyboard, and touch players.
- **What:** A four-second, schedule-derived storybook road omen whose geometry communicates wave intent, troop-role composition, and approach progress.
- **Where:** At the enemy road edge behind the enemy gate and all actors, outside HUD, objective, and input surfaces.
- **When:** Only while a battle is running and the next authored wave is at most four battle seconds away. It disappears as the wave launches; pause freezes it; ready/results never show it.
- **Why:** An approaching company should leave a readable trace in the world before it materializes, making combat feel more alive while preserving the existing precise HUD and simple controls.

## Guardrails

- Preserve encounter times, member delays, commander/timeline variations, spawn acceptance, unit lanes, combat, rewards, economy, saves, input, pause ownership, and audio exactly.
- Consume the same `WaveStatus.preview` already used by the HUD. Do not duplicate encounter selection in the view.
- Sanitize all numbers and cap the presentation at five role marks and four countdown knots; malformed data must never create NaN geometry.
- Intent and roles differ by shape, not colour alone. The signal remains readable with Effects muted and without animation.
- Normal motion may use bounded cloth lift from battle-time progress; reduced motion uses a fixed pose. Paused battle time makes both static.
- Use one pooled graphics object at a fixed depth below bases and actors. Add no texture, emitter, timer, listener, DOM node, control, live region, or save field.
- Browser execution remains GitHub Actions only. Screenshots are disclosed presentation evidence, not proof of human comprehension, balance, retention, physical-device/Safari acceptance, subjective quality, or low-end performance.

## Acceptance

1. The pure model is absent outside running play, without a preview, above four seconds, or for a zero-member malformed preview.
2. At four through zero seconds it returns finite, bounded geometry from the exact preview; intent banners and melee/ranged/heavy marks are pairwise shape-distinct.
3. Reduced motion is identical at equivalent preview state; pause cannot advance the signal because no view clock is consumed.
4. Phaser paints one dedicated object behind both bases and every lane actor and reports intent, counts, next-in, progress, shapes, and depths in a diagnostic dataset.
5. GitHub Actions Chromium reaches real rush, volley, and bulwark previews through the public Battle flow at 320, 390, and 1024 widths, pauses them through the public control, proves static/save-inert behavior, and captures original screenshots with no runtime, asset, or overflow failures.
