# Storybook interface art

The resource, command, skill and navigation symbols now share one ink-and-gouache
atlas: rounded silhouettes, warm brass, muted jade, rust, indigo and parchment.
They replace the flat colored SVG illustrations across all chapters and menus.
Directional arrows, close and sound remain simple functional line glyphs.

The source atlas lives in `art-source/storybook/interface/atlas.webp`. The built-in
image generation tool produced a transparent 4×4 atlas, with this brief: creepy,
quirky, chubby storybook; hand-inked gouache objects; strong small-size silhouettes;
consistent dark umber outlines; generous transparent gutters; no labels or panels.
Rows: coin/gem/food/battle; evolution/cards/skills/shield; gear/quest/lock/freeze;
meteor/heart/flag/trophy.

`NODE_PATH=<sharp dependency directory> node scripts/prepare-storybook-icons.cjs`
reproduces the 16 runtime WebP images. It removes detached generation flecks and
normalizes the main silhouettes into padded 128px squares. The SVG wrapper keeps
the existing `.icon` sizing and aria-hidden semantics, and avoids matching troop
portrait `img` selectors. These are DOM images, outside the Phaser texture cache.

Remaining style debt: chapters five and six still use vector battlefield art.
The new interface does not claim those chapters have been repainted.
