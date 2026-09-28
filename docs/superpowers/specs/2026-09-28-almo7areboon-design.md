# Almo7areboon — mobile-first gameplay recreation

User intent: closely recreate We Are Warriors as a playable mobile-first web game, then customize later. The repository is empty. Fidelity takes precedence over inventing a different game.

## Experience
Portrait, landscape battlefield with left/right bases, grassy environment, sand fighting lane, tiny round-headed cartoon soldiers, thick dark outlines, blue deployment cards, white upgrade sheets, persistent bottom navigation. The initial view is a usable battlefield. Touch is primary, keyboard supplementary.

Food regenerates during a battle and buys melee, ranged, or heavy troops. Troops automatically walk, target enemies, attack and damage bases. Enemy waves escalate. Killing troops earns coins retained after defeat. Coins unlock troops and upgrade production/base health. Destroying a base advances the opposing age. Evolution advances your units and home through six eras; completing all six starts a harder timeline. Cards provide passive stats. Three once-per-battle skills. Local persistence with validated recovery from corrupt data. Pause while hidden or menus are open.

## Implementation
Vite, TypeScript, Phaser, DOM controls. Deterministic simulation separate from visual state. All artwork drawn from original code, no copied binary game assets. Portrait logical world, responsive to small phones and desktop. No accounts, ads, money purchases, or server required. Original proprietary source, exact hidden tuning, and full live-service content are not available; do not claim bit-for-bit equivalence.

## Acceptance
Actual playable combat and win/loss/retry, 18 era-specific troop appearances, unlock/upgrade/evolution, card bonuses, skills, saved progress, no controls obscured at 390x844 or 320x568. Verify simulation invariants and progression automatically; inspect rendered battlefield and interact through browser controls. Deliver running local preview and documented source in the cloned repository.
