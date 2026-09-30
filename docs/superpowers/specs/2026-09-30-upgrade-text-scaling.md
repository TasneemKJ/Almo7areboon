# Upgrade text scaling and visible HUD focus

Date: 2026-09-30. Status: root-reviewed for isolated implementation after PRs 67 and 78 merged. No implementation or browser acceptance is claimed here.

## Problem and evidence

The source audit covered main `6b1db227` and mastery `d997a844`; the upgrade CSS is still unchanged at production `9828941b18981a97f0a1bd633e58e48fa55fc7b9`. Main's 119 CSS font-size declarations are pixels. A previously reported wholesale rem trial squeezed upgrade labels at 125% and above, but no new browser run was permitted for this audit.

The precise upgrade constraint is horizontal: at 320px each of the two upgrade cells is about 151px wide. A non-shrinking price button, row gap, icon, and label gap leave at most 71px for label text, less when the price grows. `.upgrade-row` has a **minimum** height, not a fixed height. Merely increasing its height does not resolve the whole-word width requirement.

The keyboard focus outline is 3px wide with a positive 3px offset. The shell clips overflow, and bottom-nav buttons reach its edge. This is a source-grounded risk of clipped focus pixels, not a newly observed browser failure.

## Outcome and scope

The two existing upgrade labels and prices follow browser/root font size through 200%, remain fully readable, and retain working purchase controls. Keyboard focus on upgrade and bottom-nav buttons remains visibly painted inside their boundaries.

Scope is CSS intrinsic reflow, rem **only** for active upgrade-label and price fonts, inset focus for `.buy-button` and `.nav-item`, and focused browser verification. Preserve the two-cell composition, action order, accessible names, price formatter, art, icons, touch dimensions, and native button elements. Do not modify simulation, economy, saves, mastery copy, troop-card bands, header layout, canvas typography, or all other fonts. This is scoped accessibility progress, not a whole-game scaling or WCAG-conformance claim.

## Layout and focus contract

1. Keep `.upgrades` as two equal columns. Allow each `.upgrade-row` to wrap intrinsically. Give `.upgrade-label` a genuine min-content inline size so an unbreakable word cannot be squeezed underneath its price; the phrase may wrap at its spaces.
2. Keep the price non-shrinking. If label plus price cannot fit, the price moves below its label **inside the same upgrade cell** and aligns to that cell's end. Row height follows content. Use a modest `0.25rem` row gap; retain existing horizontal spacing. Do not force all narrow devices into a stacked layout when content fits.
3. Replace the active 11px label size with `0.6875rem`, narrow 10px with `0.625rem`, and 12px price with `0.75rem`. Keep a unitless label line-height of 1.1. Keep icons and the 44px button minimum unchanged. Do not set a fixed px root, clamp enlarged text back down, truncate the labels, introduce horizontal label scrolling, or split words arbitrarily.
4. Preserve the existing `.world` minimum of 200 CSS pixels and existing control availability by phase. Record the row's actual added height and world height. If the acceptance matrix violates this budget, revise this small composition; do not hide commands, lower the world minimum, shrink type, or reduce artwork without review.
5. Give `.buy-button:focus-visible` and `.nav-item:focus-visible` a real 3px outline at `outline-offset:-3px`. Retain the established gold initially; use a system outline colour such as `Highlight` in forced-colours mode. The visible ring must be distinguishable from selected-nav styling and affordability borders. Do not rely only on a box-shadow or remove focus.
6. Do not rebuild the upgrade buttons when their prices change. With ample coins, buying once keeps focus on the same button, changes the price once, and does not cause label/price overlap. `MAX` remains visible on a disabled upgrade; it is not a purchase route.

## Minimal browser matrix

Use the existing approved CI browser route with isolated saves. No local browser is authorized by this documentation task. Root chooses the isolated implementation branch after current releases.

The automated regression may set the root font to the indicated value in a real browser; name these results **root-size emulation**, not a native-preference test. Hold device pixel ratio constant. DPR, CSS transforms, and whole-container `zoom` are not substitutes for this test.

| CSS viewport | Root sizes / scale | Expected label sizes | Expected price sizes |
| --- | --- | --- | --- |
| 320×568 | 16 / 20 / 24 / 32px = 100 / 125 / 150 / 200% | 10 / 12.5 / 15 / 20px | 12 / 15 / 18 / 24px |
| 390×844 | 16 / 20 / 24 / 32px = 100 / 125 / 150 / 200% | 11 / 13.75 / 16.5 / 22px | 12 / 15 / 18 / 24px |

Eight sessions cover the long-price fixture, ready and running/paused geometry, and a keyboard purchase/focus sequence. Do not multiply this into all-chapter, all-modal, all-font diagnostics.

Fixtures and small additions:

- Long prices: age 0, food/base level 23, 10,000,000 coins, all three troops unlocked, sound off, otherwise valid normal save fields. Current prices are `159.1k` / `205.8k`; after one purchase they become `225.9k` / `298.5k`. Use actual game actions and actual rendered prices, not synthetic price HTML.
- `MAX`: level 100 for both upgrades, at 320×568 with 100% and 200% root size. Assert both costs read `MAX`, both actions are disabled, and glyphs remain contained.
- One short-landscape session: 640×320 at 200% root size, long prices. Preserve the existing scrollable portrait-column fallback. Verify both upgrades and all nav targets can be scrolled into view and activated/focused without a nested-scroll trap.
- One forced-colours focus pass: reuse the 320×568 / 200% session, capture food/base and edge nav targets with native keyboard focus. No extra typography matrix.
- **One native default-font case:** 320×568 with the browser's actual default font set to 32px, no app/root style override. Add a test-only element with `font-size:1rem` and verify its computed size is 32px; also verify the actual label/price are 20px/24px. Record browser/version and the actual preference mechanism. If this capability is unsupported in the available approved browser, mark the native case explicitly **unverified**. Do not substitute another browser, CSS injection, or a different mechanism and relabel it native.

## Assertions and visual acceptance

- Verify computed font growth, not only a no-overflow screenshot. Every upgrade word and full price, including decimal point, separator, suffix, or `MAX`, stays inside its text region in both axes. Every `Range.getClientRects()` fragment is contained; no visible glyph rectangle intersects its icon, neighboring price, other upgrade, or nav. Keep words whole. Allow only a 1 CSS-pixel geometry tolerance for rounding, then inspect the screenshot for ink clipping.
- Verify no new horizontal page overflow; rows and buttons stay within the shell; `.world` remains ≥200px. Enabled purchase buttons retain at least 44×44px targets and center hit tests resolve to their own element/descendant. Existing deploy/skill/pause/speed/settings/nav controls remain available under their existing phase rules.
- Reach food, base, and nav by Tab/Shift+Tab, not just `.focus()`. Activate food with Enter and base with Space in an ample-coins fixture. Assert exactly one purchase each, stable button identity/focus while still enabled, updated cost, and correct coin/level change. Native Space on a focused purchase must not toggle battle pause.
- Capture focused food/base and first/last nav targets. Inspect the **painted ring pixels** on every edge at 320px/200% and one 390px baseline; `activeElement` and a nonzero computed outline alone do not pass this gate. Save before/after focus crops or full screenshots without an added review outline. Confirm forced-colours still paints a real indicator.
- Keep existing browser checks for troop targets, portrait/price separation, wave chip versus skills/pause, phase-specific title behavior, input isolation, and modal focus. Keep existing test, build, layering, and save-session gates. Do not broaden this PR into mastery, screen-reader, audio, all-game text-only-zoom, or full landscape redesign gates.

## Files and release claims

Expected app changes: `src/ui/combat-focus.css` and a narrowly scoped focus rule in `src/ui/continuation.css`. Verification may add `scripts/capture-upgrade-text-review.mjs`, a package command, and one CI step/artifact following the existing preview lifecycle. Prefer independent output `artifacts/browser-review/upgrade-text/` so default captures remain untouched.

README may report only what the accepted evidence proves. If native preference remains unavailable, say that 100/125/150/200% root-size emulation passed for the upgrade controls and native preference remains unverified. Do not say all game text follows system size. A future troop/header and mastery/recovery typography slice is outside this PR.

Implementation waits for root's review of these documents. This requirement does not create another user approval request; the user's ongoing PR/merge authorization remains in effect.
