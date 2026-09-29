# Olive Terraces — chubby storybook art

Continue the first chapter's scratchy ink, gouache texture, plump silhouettes, amber lamps and quiet indigo dread into the farming chapter. Scope: its landscape, farmhouse, Fieldhand, Slinger and Harvester; matching portraits and chapter previews. Simulation, prices and progression are unchanged.

## Asset provenance and packing

Created with built-in image generation, using the opening village and Pathkeeper as style references. Prompt set: an olive-terraced Levantine farming valley with a clear lane at 59–73% height; an isolated crooked farmhouse; six right-facing poses each for a round-bellied hoe carrier, headscarf slinger and broad-apron sickle carrier. Character constraints: adult, three-head proportions, stubby legs, large uneasy eyes, dark ink contours, gouache grain, transparent background, three columns by two rows, idle / three walk poses / windup / attack. No text or UI in artwork.

Sources: `art-source/storybook/olive/`. Runtime assets: `public/art/storybook/olive/`. Reproduce with `NODE_PATH=<sharp location> node scripts/prepare-storybook-art.cjs --olive`.

All six poses share one scale and foot baseline. Fieldhand's source row divider is 503px, inside the transparent gap, to prevent a next-row hat fragment entering an upper frame. New cells are 224×192; prior cells remain 256×192. Both painted chapters share identical base textures between teams, using mirroring; shared unit atlases retain enemy tint and team halos. Total decoded manifest: 52 textures, 41,779,848 bytes, below the unchanged 42MB guardrail.

## Verification

- Local: 275 tests passed; production build passed.
- Browser capture suite expanded from seven to eleven states: real evolution UI from First Fires to Olive Terraces (including different player/enemy chapters), second-chapter ready at 390px and 320px, and all three roles deployed through normal controls.
- Browser results and skeptical review are recorded on the PR before merge. Save fixtures unlock the requested view; they are explicitly fixtures, not evidence of a full campaign run.

## Remaining scope

Chapters three through six retain their existing art. Whole-campaign progression, physical-device GPU performance and live deployment are not established by these screenshots. Deployment may remain blocked by the hosting quota.
