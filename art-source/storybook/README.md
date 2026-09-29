# Opening chapter: chubby storybook creep and quirk

Art direction requested by the user, 2026-09-29: tactile picture-book ink and gouache, round bellies and short limbs, crooked Levantine limestone architecture, warm lanterns against uneasy indigo skies. Expressions are peculiar and endearing. No named artist or commercial asset pack was used.

## Source and production

Five original assets were generated with the built-in image generation tool: `village.webp`, `shelter.webp`, and three six-pose character sheets (`pathkeeper`, `thrower`, `rider`). These are high-quality WebP copies of the generated source images. Discarded realistic and thin-character drafts are not shipped.

Shared generation brief: "Chubby, creepy, quirky storybook game art. Hand-inked gouache, tactile paper grain, expressive asymmetry, short stout legs, round belly and cheeks, muted teal cloth, ochre linen, warm chalky stone, indigo shadows. Ancient Levantine folktale setting. No text, UI, photorealism, glossy 3D or flat vector styling."

Character additions: Pathkeeper carries a stone club and wooden buckler; Thrower wears a floppy teal hood and a stone pouch; Dino Rider rides a squat round moss-teal dinosaur. Six poses: idle, three walk phases, wind-up, strike/release. Each generated sheet uses a 3 × 2 grid, facing right, with transparent gutters. Shelter: a squat limestone hut, crooked chimney, reed awning, teal pennant and amber lantern. Landscape: clear horizontal battle road at 66% of height, open sky above, dark grasses below.

## Packing

Run `node scripts/prepare-storybook-art.cjs` with `sharp` installed or available through `NODE_PATH`.

- Detect separate alpha silhouettes per source row; the rider row boundary is 500 px to exclude the next row's raised club.
- Apply one shared scale to all six poses of each role.
- Align the midpoint of the feet to a common anchor and baseline (181/192).
- Export 1536 × 192 strips with six 256 × 192 frames and separate idle portraits.
- Export the 900 × 1000 landscape and a 256 × 256 shelter with footprint at 224/256.
- `packing.json` records source bounds and scale so alignment can be inspected and reproduced.

Runtime files live in `public/art/storybook`. The renderer loads WebP as images and derives frame bounds from manifest dimensions. Both teams share each chapter-zero character atlas; mirroring, warm enemy tint, team halos and health bars provide side cues. The artwork uses its own painted light; legacy scene grading and geometric environment light overlays remain on later chapters.

The complete initial texture set stays below the existing 42 MB decoded-pixel guardrail. The opening chapter uses painted foreground texture within the background and a 1 × 1 transparent foreground placeholder; later chapters retain their separate foreground layers.

## Verification scope

CI captures normal ready, deployment, pause/resume, skirmish and 320 px layout states. Two explicitly named fixture captures unlock all three roles in an isolated browser profile, then use normal deployment and skill controls to exercise walking and combat. These are visual fixtures, not evidence of normal unlock progression. Later chapters retain the previous artwork and remain a future art-production task.
