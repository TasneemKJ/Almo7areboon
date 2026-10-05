# Asset requests

Art the engineering sessions should not improvise. Each entry: what, where it is used, size and format, mood. Keep the established storybook direction (warm lantern light, Levantine dusk, painted texture; see `art-source/storybook/` and `DESIGN.md`).

## Open

1. **Share card key art (Open Graph / Twitter).** Used by `index.html` (`og:image`, `twitter:image`). 1200x630, JPEG under 200 kB (also a 2400x1260 master). Mood: a dusk battlefield with the player's company mid-march toward a rival gate, lanterns, the game's wordmark area left clear on the left third. Interim: `public/og-image.jpg` is a crop of the shipped Harbor Watch plate (`public/art/storybook/harbor/village.webp`).
2. **Install and store icons.** `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` exist; a store listing also needs a 1024x1024 PNG master and three to five phone screenshots (1080x1920 portrait) from real play. Mood: matches `icon.svg`.
3. **Landscape rail frame (optional).** The new landscape command rail (`src/ui/landscape-rail.css`) uses the deck's existing navy gradient with a brass seam on its left edge. A painted vertical frame or paper-and-brass texture strip (512x2048 WebP, tileable vertically) would make it feel carved from the same world.

## Notes
- The `og:image` path is relative until the production domain is recorded in the repo; scrapers that need an absolute URL should get it then.
