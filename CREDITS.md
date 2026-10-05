# Credits and licences

- **Game code, vector art, storybook plates, icons, characters, factions and story text:** original to this project (`src/`, `public/art/`, `art-source/`, `public/icon*`). Fictional Levantine settings, not exact historical reconstructions. Licence for the project's own content: not yet stated by the owner (all rights reserved until declared).
- **Audio:** synthesized at runtime by the game's own code (`src/view/audio.ts` and the soundscape worker); no sampled third-party audio.
- **Fonts:** none are bundled or loaded remotely; text uses system stacks (Trebuchet MS, Arial, Georgia).
- **Libraries:** [Phaser 3](https://phaser.io) (MIT), bundled in the build. Build and test tooling (Vite, TypeScript, Playwright, `@types/node`) are development dependencies (MIT or Apache-2.0) and are not shipped.
- **Reference:** the loop is inspired by *We Are Warriors!* on Google Play; no assets or code from it are used.

Flag for the owner: the AI-assisted origin of the storybook art and the project's own licence should be stated explicitly before a public release; `art-source/storybook/README.md` describes the source art.

## Privacy

The game has no accounts, analytics or backend. Progress is stored only in this browser (`localStorage`, the `almo7areboon.save.v1` key and its backup) and in the offline cache. Nothing is sent anywhere; export and import are local files you control. Clearing site data removes your progress.
