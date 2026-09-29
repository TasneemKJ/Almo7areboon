# 19 — Combat feedback punch and chapter-aware HUD

Baseline: `1f05701` (main after #21).

## Audit findings addressed (playtest of #21 on main)
- **Skill banners evicted.** "FROZEN", "METEOR" and "+10 FOOD" shared one 24-slot FIFO with damage numbers. With 40+ troops fighting, 24 numbers arrive in about 200ms, so a banner could vanish almost at once. Banners now bypass the number cap.
- **Weak freeze feedback.** The freeze marker was a 2px hairline. Freeze now adds a cool camera flash (skipped under reduced motion), frost flares and denser ice sparks on every enemy, and a soft icy ground wash with a rim under the frozen side.
- **Small numbers.** Damage numbers go from 12px to 13px (15px for heavy hits), and banners from 19px to 22px with a thicker stroke. All floating text gets a dark drop shadow so it reads against bright chapter-one skies.
- **Chapter-blind HUD.** Deploy cards now take the chapter accent in their radial fill, glow in the accent when affordable, bob gently when ready, and compress when pressed. Available skills glow in the accent. A plain gradient comes first as the `color-mix` fallback, and the global reduced-motion rule already stops the bob.
- **Pale road in bright chapters.** The additive stage pool on chapters 1–3 drops from .07 to .045, so troops stay darker than the lane.

## Verification
Five new tests (268/268); build passes; headless Chromium playtest of full battles with all three skills; zero page errors. Evidence: [before / after / freeze](evidence/19-feedback.jpg).
