# Lantern Quarter — fourth painted chapter

Continue the approved creepy, quirky, chubby storybook direction through a historic Levantine craft courtyard. Crooked timber balconies, striped awnings and amber lamps frame a dark central passage; the warm stone battle lane remains clear. New gatehouse, Gatekeeper, Musketeer and Cannon crew match the first three painted chapters.

## Assets

Built-in image generation used the shipped village and Pathkeeper as style references. Prompts specified dark scratchy ink, gouache paper grain, round adult faces/bellies, stubby legs, cream linen and teal accents. Gatekeeper: buckler, curved sabre and oversized keys. Musketeer: plum cap, mustard coat and short flintlock carbine. Cannon: round operator behind a short brass barrel on oversized timber wheels. Six coherent poses per sheet, right-facing, alpha background, no detached projectiles or separate smoke/flash.

Source artwork: `art-source/storybook/lantern/`. Runtime: `public/art/storybook/lantern/`. Reproduce with `NODE_PATH=<sharp location> node scripts/prepare-storybook-art.cjs --lantern`. Cells remain 224×192 with shared per-strip scale and foot baseline181. All18 packed poses inspected; no cross-row fragments or clipping found. The existing chapter configuration handles UI, portraits, preview imagery, mirroring and authored lighting without simulation changes.

## Verification

- New Lantern integration assertion failed before registration, then passed after integration.
- Local278 tests and production build passed.
-44 manifest textures /41,987,280 decoded bytes remain below the unchanged42MB guardrail. This is a manifest budget, not a physical-device GPU measurement.
- Browser suite expanded to22 states, with five new captures: real Harbor-to-Lantern evolution, mixed player/enemy chapters, ready390/320, three roles deployed and later battle. New screenshot artifact is separate to keep downloads bounded. Prior17 states still run.
- Independent review and CI/screenshot findings are recorded on the PR before merge. Timed combat images do not certify every attack pose at contact, and save fixtures are not full campaign completion evidence.

Chapters five and six retain their existing assets. No balance, prices, saves or progression logic changed.
