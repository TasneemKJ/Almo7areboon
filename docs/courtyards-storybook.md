# Courtyards Beyond — sixth painted chapter

Courtyards Beyond completes the painted treatment of all six battlefields, shelters and troop rosters. The established ink-and-gouache palette continues through layered stone courtyards, elevated bridges and restrained teal lanterns. Round-faced Light Guards and Troopers carry brass-and-glass equipment; the Sky Skimmer uses the same timber, teal and brass materials. Together with the painted main HUD icons, this removes the final battlefield transition into the older vector art.

## Sources and packing

The five approved generated PNGs were inspected before normalization:

| Asset | Generated source |
|---|---|
| Village | `exec-08962c60-013c-4068-b62e-60280c779839.png` |
| Shelter | `exec-6677c99c-9ce0-4008-8939-b78b70105cbe.png` |
| Light Guard | `exec-72091136-421c-46cb-9aa0-9da859591280.png` |
| Trooper | `exec-9ef46201-653c-4c62-bf1f-2700b85eb4c4.png` |
| Sky Skimmer | `exec-a2730a54-5309-43b8-a88e-48ed3e441df5.png` |

Archived sources use WebP quality 94 and alpha quality 100 in `art-source/storybook/courtyards/`. Original generated PNGs remain available separately. Reproduce the runtime files with:

```sh
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/prepare-storybook-art.cjs --courtyards
```

Each role retains six poses, one shared scale, a 216×192 cell and foot baseline 181. At the packer's alpha >64 threshold, empty row gaps are Light Guard 508–518, Trooper 509–518 and Sky Skimmer 472–544. The normal row 512 split is safe; no special override is needed. All 18 packed poses were inspected for full silhouettes, shared proportions, frame separation and weapon clearance. Teams share each sheet, with runtime enemy mirroring.

The standard 256×256 shelter canvas retains baseline 224. Six authored damage attachments fit its upper masonry, arch and narrow side columns. The existing generic critical crack failed containment on both teams before replacement. The new geometry passes the decoded-alpha regression; independent sampling checked 4,200 stroke points, including the 2.2-pixel outline, with minimum alpha 251.

## Budgets and verification

- 36 manifest textures: **41,973,528 decoded bytes**, below the unchanged 42,000,000-byte limit.
- Courtyards battlefield downloads: **681,438 bytes**; runtime art including portraits: **725,232 bytes**, below 800,000 bytes.
- Archived source files and packing metadata: **2,959,650 bytes**.
- The integration regression failed before chapter 6 registration, then passed with all six valid chapter indices using shared painted team assets. Only invalid chapter indices retain the old fallback behavior.
- Local verification passes all **284 tests** and the production build.
- Browser coverage adds the Hillside-to-Courtyards evolution, ready states at 390 and 320 pixels, all three roles, and deterministic final-chapter lane/base/damage cases. Actual capture results and independent review are recorded on the PR.

This finishes the battlefield asset conversion, not every visual improvement. Foreground objects remain baked into a flat scene plate, so those painted objects cannot independently occlude troops. Combat effects retain their existing procedural style and generic attachment offsets; source-lane occlusion from the prior fix remains in place. The decoded budget is a manifest calculation, not a physical-device memory measurement. No balance, prices, saves, progression or other gameplay rules changed.
