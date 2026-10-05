# Ultra Visual & Atmosphere Overhaul — Design

Date: 2026-10-05

## Intent

Elevate Almo7areboon into a more cinematic Levantine dusk storybook battlefield while preserving combat clarity, portrait-phone play, deterministic simulation, authored settlement art and the low-chrome command surface. The battlefield must feel more alive and layered, not more UI-heavy.

## Success criteria

- Three-dimensional depth reads from sky to village to lane to foreground despite the 2D/Phaser composition.
- Units remain immediately readable by side, lane and action.
- Dusk light and practical village light create a clear hierarchy around combat.
- Impact effects ground units into dust/stone without hiding hit timing.
- Every chapter keeps its authored identity; the overhaul does not homogenize environments.
- No new menus, rewards, balance paths or save ownership.
- 320px/portrait accessibility and reduced motion remain intact.

## Direction

### 1. Storybook atmospheric perspective

Extend existing `dusk-atmosphere.ts`, `cinematic-grade.ts`, `living-sky.ts` and village-light systems. Add restrained source-space haze/mist marks, chapter-specific horizon temperature and foreground edge framing. All marks remain deterministic presentation data.

### 2. Lighting hierarchy

Village/practical lights anchor the settlement while battle impacts supply brief local light. Add stronger but bounded key-light rays and ground response, ensuring the active lane remains higher contrast than decorative background.

### 3. Lane grounding

Use existing lane perspective and ground effects to add:
- soft depth-sensitive contact dust;
- impact scuffs and short-lived particulate rings;
- slightly stronger base contact/shadow staging;
- clearer foreground/midground separation.

### 4. Living sky and chapter character

Keep stars/clouds/omens sparse. Each chapter may bias cloud/haze placement and color, but no full-screen shader stack is added. Reduced motion becomes static composition, not missing information.

### 5. Foreground composition

Use existing foreground vignette ownership to frame edges without covering deployment zones or battle banners. No persistent card wall enters combat.

## Architecture

Changes stay in `src/view/` and consume existing game/view data. No simulation-side reward or combat rule changes. Prefer reusable frame-plan functions and existing Phaser Graphics objects over new per-frame GameObjects or textures.

## Failure and performance handling

- Respect `battlefieldRendererMode` and render-resolution policy.
- Reuse graphics layers/pools.
- Cap particles and short-lived effects.
- Drop decorative sky/fog density under lower quality before touching silhouette clarity.
- Canvas fallback remains valid.

## Verification

Add focused Node tests for new presentation frame plans and reduced-motion parity. Run:
1. `npm test`
2. `npm run build`
3. `npm run review:browser`
4. `npm run review:overlap`
5. `npm run review:contrast`
6. portrait and desktop screenshot review across at least three chapters and battle states.

## Non-goals

No new monetization, new progression, card-system changes, army balance changes, menu-first navigation or replacement of authored chapter art.
