# Hillside Watch — fifth painted chapter

Hillside Watch continues the approved ink-and-gouache storybook treatment through a fictional hillside town. Rooftop water tanks, aerials and utility wires mark the imagined present while stone gates, timber balconies, teal shutters and warm lamps retain the visual language of the earlier chapters. The Sentinel and Scout have round faces, short legs and layered linen clothing; the Tank has a compact rounded body and a visible crew member.

## Sources and packing

The five approved images were generated together with the established storybook art as direction. The supplied source PNGs were inspected before packing:

| Asset | Generated source |
|---|---|
| Village | `exec-0c379f86-08fb-432a-932a-ecbd387deb57.png` |
| Sentinel | `exec-0744add8-cbea-4c87-b00b-ed15c6879643.png` |
| Scout | `exec-354497a9-0df5-4da7-80f2-7220f5545cae.png` |
| Tank | `exec-282423c5-9b47-4d70-922b-7b20c71a5028.png` |
| Shelter | `exec-55786afa-830e-45dc-8cc5-aa7e88bd7461.png` |

Archived sources are WebP quality 94 with alpha quality 100 in `art-source/storybook/hillside/`; original generated PNGs remain available separately. Reproduce runtime assets with:

```sh
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/prepare-storybook-art.cjs --hillside
```

The existing six-pose packing process retains one shared scale per role and foot baseline 181 in a 192-pixel-high cell. Hillside uses 216-pixel-wide cells, keeping the unchanged 42 MB decoded texture budget without resizing earlier artwork. At alpha >64 the measured empty row gaps are Sentinel 509–523, Scout 511–531 and Tank 484–556; the normal split at row 512 is safe for all three. All 18 packed poses were inspected: complete right-facing silhouettes, consistent proportions, and no clipping or adjacent-row fragments. Both teams share each atlas; the renderer mirrors enemy art.

The shelter retains the standard 256×256 canvas and baseline 224. Six authored crack attachments were checked against its actual decoded alpha for both teams, including the 2.2-pixel outline. The regression first failed with legacy attachment positions, then passed with the Hillside positions. Independent sampling found a minimum alpha of 251 across 5,328 crack samples.

## Budgets and verification

- 40 manifest textures, totaling **41,980,404 decoded bytes**, below the unchanged 42,000,000-byte limit.
- Hillside battlefield downloads total **644,420 bytes**; including all three portraits, runtime art totals **691,608 bytes**, below 800,000 bytes.
- Archived sources and packing metadata total **2,928,697 bytes**.
- The integration regression failed before age 4 registration and passed after the scenery, shelter, portraits and shared troop atlases were registered.
- Local verification passes all **283 tests** and the production build. One older fallback assertion still expected age 4 to be unpainted; it was updated to keep that contract only for age 5.
- Browser coverage includes the Lantern-to-Hillside evolution, ready states at 390 and 320 pixels, all three deployed roles, and deterministic lane/base/damage overlap cases. Independent review and actual CI capture results are recorded on the PR.

The scene remains one painted plate with its foreground baked in, matching the current painted-chapter renderer. Courtyards Beyond remains on its existing vector art. No simulation, balance, prices, saves or progression rules changed. The decoded budget is a manifest calculation, not a physical-device memory measurement; generated six-pose sheets are not a claim of frame-by-frame hand animation.
