# Almo7areboon: behavioral atmosphere gates

Date: 2026-10-05

## Status and scope

**The forty-refinement roadmap remains unfinished. Passing these tests does not prove forty implemented improvements, forty iterations, or visual acceptance.**

This change replaces the synthetic count-only gate with contracts for currently implemented renderer behavior. It changes tests and this evidence note only; it adds no production feature, helper, visual pass, gameplay rule, save change, or release claim.

The inherited test failed only because its prospective refinement helper did not exist. It checked an eight-by-five array shape, not a rendered improvement. The older roadmap sentence saying the passes are implemented is not a verified completion record; the roadmap remains unfinished.

All other assertions in the owned test file are preserved. Checked against `DESIGN_RULES.md`; no design-rule violations found. The existing art direction and player-facing behavior are unchanged.

## Observed behavior

- Actual painter output applies the landscape translation and scale to depth fills and ripple strokes, using an independently calculated half-scale fixture.
- Depth, glow and ripple commands carry their own color/opacity/line style, so a preceding mark cannot supply the next mark's style.
- All six chapters produce finite, positive geometry across three phone/landscape proportions; rendered reduced-motion frames stay identical while ordinary frames evolve.
- Frozen source marks and placement stay unchanged. The Phaser Graphics boundary has no canvas save/restore contract; no such API was invented.

## Fresh verification

- `node --experimental-strip-types --test tests/dusk-atmosphere.test.ts`: 14/14 passed, exit 0.
- `npm test`: 1,025/1,025 passed, exit 0.
- Deliberate mutations were applied only to isolated temporary source copies. Each mutation failed the intended behavioral assertion; checkout production files were never changed by this test work.

## Broken-source checks

- `skip-landscape-projection`: exit 1; rejected by `✖ painting applies the landscape translation and scale to actual depth and ripple geometry (1.329161ms)`.
- `discard-mark-color`: exit 1; rejected by `✖ painting applies the landscape translation and scale to actual depth and ripple geometry (0.9951ms)`.

## Evidence boundary

These tests record calls at the real canvas/Graphics boundary. They are not pixel-rendered browser screenshots, interaction journeys, performance measurements, physical-device checks or art-direction acceptance. The full renderer/browser and release gates remain separate. The original roadmap needs further real implementation and fresh visual evidence; no roadmap entry is marked complete by this change.

- Renderer source: `src/view/dusk-atmosphere.ts`
- Renderer SHA-256: `0056b0fe567efb4be7bc6a014493abbd344695a493d416f31f9f33281e7349d8`
- Test file: `tests/dusk-atmosphere.test.ts`
- Test SHA-256: `a5006a299e020f566bff94a7afe778eb02545336b82e8c06fb2818f8bc929504`


## New-main reconciliation, 2026-10-05

Main `00a75cb8d6705926103e746f81fc8495945630cb` subsequently supplied the previously missing refinement-data helper and an additional bounded-input metadata test. Reconciliation preserves that production file exactly and retains the new upstream test alongside all three real-painter tests above. The source helper is not consumed by the rendered atmosphere; its existence does not complete forty visible refinements. The original history and mutation evidence above remain evidence for their recorded source only.

Fresh reconciled checks: dusk/command/landscape/CI-layout focused set 59/59; complete unit suite 1,035/1,035; fast gate 988/988; TypeScript/Vite/shared-size build exit 0. Final-source browser and screenshot acceptance remain separate.

- Reconciled renderer SHA-256: `a623edfaf3c68f611693de1c80c0e98dddb462b646cff28c067640b6f557411a`
- Reconciled test SHA-256: `3ca2ad1204dda8bbd6776a39b750bcf07980069398ee8b3e8fae47bbbee3530a`
