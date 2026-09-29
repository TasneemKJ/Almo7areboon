# 08 — Simultaneous contrast for combat silhouettes

Baseline: merged design-theory PR #5, main merge `3d7f4a72c4758ae04edab7c9d445ce3711b17b07`.

## Design philosophy
As environments become richer, playable actors risk losing figure/ground separation. This pass applies **simultaneous contrast** and **silhouette-first hierarchy** rather than outlines: each troop gets two extremely soft local ellipse fields behind the body, tinted toward its faction. The field is broad enough to separate the silhouette from detailed stone, foliage and lanterns, but weak enough to read as local bounced light rather than a gamey aura.

The technique is deliberately local. It does not brighten the whole battlefield or darken the background, and it does not add a persistent halo around empty space. Lane perspective and role mass influence the field size so a front-lane heavy reads heavier without changing simulation scale.

## Implementation
- New pure view model `src/view/silhouette-focus.ts` returns two bounded ellipse marks per actor.
- Player/enemy geometry is identical; only blue/coral light color differs. Frozen enemies use cool cyan.
- Hit feedback temporarily strengthens the field but alpha stays at or below `0.13`.
- Invalid lanes and roles fall back to middle-lane melee presentation.
- The existing battlefield shadow `Graphics` object paints the focus before contact shadows. No new scene object, texture, shader, timer, save state or action is introduced.

## Verification
Five focused regressions were observed failing before implementation and passing after it. Fresh full suite: **202/202 passing**. TypeScript/Vite production build passed; the existing Phaser vendor-size warning remains.

This pass changes renderer geometry only; character/scene SVG sources are unchanged, so the previous full source-art raster QA remains applicable to those assets rather than being falsely recounted as new art evidence.

Browser/mobile/Safari and measured frame-rate acceptance remain outstanding under the existing browser restriction. This is the eighth connected refinement toward forty. No scheduler.
