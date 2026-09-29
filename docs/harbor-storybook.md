# Harbor Watch — coastal storybook chapter

## Direction and scope

Continue the approved creepy, quirky, chubby art through the third chapter: domed Levantine waterfront warehouses, warm lanterns against an indigo inlet, a broad unobstructed quay, a squat gatehouse, and rounded Quay Guard / Archer / Rider silhouettes. Keep simulation, progression, prices and controls unchanged. The existing shared chapter configuration supplies portraits, battlefield textures, previews, UI typography and authored-lighting treatment.

## Artwork and reproduction

Built-in image generation used the shipped village and Pathkeeper sheet as style references. Prompts specified scratchy dark ink, gouache paper texture, adult three-head proportions, short legs, expressive uneasy faces, cream linen and teal accents. The guard carries a short bronze sword/shield; the archer draws a compact bow; the rider sits on a barrel-bellied chestnut pony. Each character was generated as one six-pose sheet: idle, three walk poses, windup, release. Landscape composition reserves 59–74% height for a clear battle lane, with the contact line at 66%.

Two corrections were made before integration: removed a detached arrow from the Archer release pose (the runtime owns projectiles), and regenerated Guard/Archer sheet spacing to provide a transparent horizontal gutter. Rider normalization splits at y=496 inside its transparent gap. One shared scale per animation and a bottom-center foot anchor preserve proportions.

Source: `art-source/storybook/harbor/`. Runtime: `public/art/storybook/harbor/`. Reproduce with `NODE_PATH=<sharp location> node scripts/prepare-storybook-art.cjs --harbor`. Runtime frames: 224×192, six per strip, foot baseline 181. All source artwork and packing metadata are committed.

## Verification and limits

- Harbor integration regression was observed failing before the configuration change, then passing afterward.
- Local 277 tests and production build pass. The manifest has 48 textures / 41,883,564 decoded bytes; the original 42MB cap remains unchanged.
- Browser suite expands to 17 captures: prior chapters, real Olive-to-Harbor evolution, mixed player/enemy chapters, 390px and 320px Harbor ready states, all three roles and a later clash. Portrait loading, price-bar separation, horizontal overflow and asset failure checks are included.
- CI results, screenshot audit and independent skeptical review are recorded on the PR before merge. Save fixtures expose chapter states; they are not a full campaign completion test.
- Chapters four through six retain existing artwork. Physical-device GPU performance and whole-campaign progression remain outside this pass.
