# 15 — Weight-aware death and collapse choreography

Baseline: merged material-impact PR #12, main merge `46761020b371bc21b0ded3b598a8b93a224bee7c`.

## Design philosophy
This pass applies **weight distribution**, **follow-through**, and **material/era continuity** to unit exits. The previous 280 ms tumble made an infantryman, a mounted/heavy unit and a future combatant leave the scene with the same visual physics. The new model keeps the exit short, but lets mass and era change the line of action.

Melee infantry folds with the strongest directional lean. Ranged units collapse with less rotation. Heavy units settle and compress rather than cartwheel. Future units use a restrained upward dissolve with minimal rotation, so their exit language matches the energy-impact vocabulary instead of imitating cloth and gravity.

## Implementation
- Added pure view model `src/view/death-choreography.ts` with bounded `collapse`, `settle` and `dissolve` profiles.
- `TroopView` now retains immutable age/role presentation metadata when the sprite is created. This is required because the live simulation unit is intentionally gone before the view-residue cleanup loop runs.
- `DeathVisuals` consumes the stored age/role and applies bounded position, scale, lean and opacity curves; retained residue count remains capped at 24.
- Reduced-motion behavior remains immediate cleanup: no death tween is retained.
- Simulation unit removal, collision, rewards, targeting, save data and death event timing are unchanged.

## Verification
Seven focused regressions were observed RED before implementation. The first full build then exposed a TypeScript ownership error: cleanup tried to read `unit.age/kind` after the unit loop had ended. Systematic debugging traced the issue to the view/simulation boundary. The regression was corrected to require age/role on `TroopView`, then the production fix stored those immutable fields at sprite creation.

After that fix, the targeted suite and TypeScript/Vite production build passed. Fresh full suite: **243/243 passing**. The existing Phaser vendor-size warning remains.

No sprite SVG source changed, so earlier raster counts are not recounted as new art evidence. Browser/mobile/Safari, subjective motion quality and measured frame rate remain unverified under the existing browser restriction. This is refinement 15/40. No scheduler.
