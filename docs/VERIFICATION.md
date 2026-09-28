# Work-in-progress verification — 2026-09-28

This checkpoint is being committed at the user's request to push the changes so far. It is not a completion or release claim.

## Fresh checks

- `npm test`: **37 passing, 6 failing**, exit 1 (43 tests total).
- `npm run build`: **fails**, exit 2. The new progression tests reference `Profile.furthestBattle` and the `select-battle` action, which are not implemented yet.
- The repository was empty before this checkpoint.

## Known failures and unfinished integration

1. The same-age campaign test expects a basic-only army to win every age. Age 4 remains in combat at its 150-second limit after correcting artillery behavior. Combined-army gameplay needs verification and this test needs review against the intended game rules.
2. Evolution does not yet reset coins and battle progress to match the reference.
3. Earlier-battle selection and furthest-unlocked battle tracking are not implemented.
4. New timelines do not yet clear coins.
5. Save migration for battle unlock tracking is not implemented.
6. Evolution prices still use the initial prototype values instead of the researched first-timeline prices.

The new `src/game/cards.ts` has 30 researched cards and 14 passing focused tests. It is not yet integrated into the simulation, save format, or card screen; those still use the six prototype cards.

## Browser verification

Visual and interaction verification remains pending because Browser Use denied access to localhost:5173. The user authorized retries, but the tool continued to report a saved site block. No alternate browser route was used to bypass it.

Still to inspect: 320×568 and 390×844 layouts, desktop layout, troop animation, first-battle controls, results, evolution/cards/skills screens, modal focus, reload persistence, and console errors.

## Fidelity status

The full requested clone is unfinished. Timeline 1 troop names, 18 troop designs, six bases, projectile types, and Stone Age cost/strength ratios have been corrected against public references. Balance outside those verified points remains provisional. Full timeline content, the reference skill system, heroes, runes, dungeons, events, and other progression systems remain incomplete or absent. Exact visual equivalence has not been verified.
