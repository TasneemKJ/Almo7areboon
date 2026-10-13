# Evolution clarity finish-line review — 2026-10-14

This batch is stacked on the landscape command-rail repair in PR #203.

## Player-facing changes

- The Evolution decision now appears before the chapter catalogue instead of after a long scroll.
- The decision names exactly what resets and what survives.
- The player's current Camp coin balance is visible beside the Evolution decision.
- When Evolution is unaffordable, the exact missing coin amount is shown.
- Existing battle/opponent gates and the protected Start over confirmation remain unchanged.
- The sticky Back to Camp return paints over the scroller gutter with shadow bands rather than widening the horizontal scroll area.

No combat rules, prices, progression math, save schema, card ownership, audio, dependencies, workflows or deployment settings change.

## Verification

The regression file was observed RED on the PR #203 source for the missing decision/wallet placement, shortfall, and sticky-return behavior.

After implementation:
- `node --experimental-strip-types --test tests/evolution-decision-layout.test.ts`: 6/6 passed.
- `npm test`: 1,460/1,460 native tests passed.
- `npm run build`: TypeScript check and Vite production build passed.
- Built JavaScript: 498,014 / 512,000 bytes gzip.

## Remaining acceptance

Keep this PR draft until the current-source Camp/Evolution journey is repeated on touch/mobile in the required portrait and landscape sizes, including enlarged text and the exact-price/shortfall states. PR #203 should land first or this branch should be rebased before merge.

This batch is not counted as 400 full-game design iterations.
