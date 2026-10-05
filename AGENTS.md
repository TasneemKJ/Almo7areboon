# AGENTS.md

## Repository identity

Almo7areboon is a fictional Levantine dusk/storybook strategy game. Current `main` source, authored storybook art, original units/factions/eras, the `almo7areboon.save.v1` save key and the current migration/progression rules are authoritative.


## Read first

1. `AGENTS.md` (this file), then `CLAUDE.md` for day-to-day conventions.
2. `ARCHITECTURE.md`: layers, modules, save and test map.
3. `DESIGN_RULES.md` and `DESIGN.md`, plus `UX-CONTRACT.md`: design principles and the interaction contract.
4. `TODO.md`: the live task list. `NEXT_ITERATION_PROMPT.md` is the template for requesting a change.

## Iteration workflow

1. **Refresh and audit.** Fetch `origin/main`, read open PRs, then run `npm ci`, `npm run build`, `npm test` and a browser look at the exact head.
2. **Brainstorm** 20 ideas (rule 3 below), shortlist a few that belong to the game.
3. **Check the rules.** A change that breaks the design contract (`DESIGN.md`, `UX-CONTRACT.md`, `DESIGN_RULES.md`) or the layering in `ARCHITECTURE.md` needs a recorded reason; prefer the compliant alternative. The owner has asked sessions to decide on their own within these rules and report blockers rather than ask.
4. **Update `DESIGN.md` / `UX-CONTRACT.md`** when what the player sees or feels changes, and **`TODO.md`** with new tasks (tick finished ones; never delete them).
5. **Implement** in small increments in `src/`; keep gameplay consequences in the simulation.
6. **Test**: add a regression test per change in `tests/*.test.ts`, run `npm test` and `npm run build`, run the browser checks the change touches, and view screenshots at 390x844 and 1280x800 plus the mobile pass.
7. **Ship once**: one push, one PR, one merge per verified batch; confirm the `verify` check is green and main CI succeeds after the merge.

## Development boundaries

- Keep gameplay consequences in the simulation; presentation and input adapt to it rather than duplicating rewards or balance.
- Prefer direct battlefield interaction over adding menus, toasts or persistent panels.
- Preserve pause, save-session ownership, reduced-motion, keyboard/focus and touch behavior.
- Keep visual effects bounded and reuse current authored assets/render pools when possible.
- Use a separate branch and PR for each substantive iteration.
- Validate source tests/build and affected GitHub Actions browser/save/reliability paths on the exact final head.
- Treat screenshots and browser fixtures as evidence for those exact environments only, not as physical-device, Safari, performance or retention proof.

## Coordination

Refresh main, open pull requests and exact heads before edits or integration. Do not overlap another active owner's files. Reconcile a moved base without force and re-run affected verification. Final integration records the reviewed head and resulting merge SHA.

## Standing rules from the owner (every session follows these)

1. **Mobile first.** The game must work flawlessly by touch before anything else: Playwright with `hasTouch`, `isMobile` and device scale 2-3 at 320x568, 360x640, 390x844, 412x915 portrait and 844x390 landscape; tap targets at least 44px; nothing clipped, overlapped or horizontally scrolling; orientation change and backgrounding keep state; check a 4x CPU throttle. A mobile failure blocks the PR.
2. **Captivating, ultra-professional visuals and UI/UX** that fit this game's folk-tale battle world: critique screenshots as an art director (focal point, depth, lighting, type hierarchy, spacing rhythm, icon consistency, state polish, reduced motion), then as a player mid-battle (thumb reach, quiet HUD). Fix the worst gaps first inside the existing art direction (`art-source/`); never restyle the identity.
3. **A 20-idea brainstorm each iteration** using IDEAL (identify, define, explore, act, look back) and the 5Ws, across the lenses: visuals, atmosphere, game feel, UI/UX, onboarding and self-teaching, game loop, gameplay, balance and pacing, audio, writing, accessibility, input, replayability, session design, data safety, loading and first paint, release readiness, stability, retention. Pick a few that belong to this game's tone, spread across lenses; record the brainstorm in `docs/audits/`. Skip analytics, accounts and monetization.
4. **Local-first work; one push, one PR and one merge per verified batch.** Run `npm test` and the build locally, view screenshots, then push once. A `[skip ci]` backup push of the dev branch is allowed at milestones; the PR head must carry a normal commit so the gate runs.
5. **PR and deploy gate of two minutes or less.** The `verify` workflow runs only `npm run build` and `npm run test:fast`. Heavy suites (battle banner, chronicle, mobile, reliability, 40 iterations, full verification) are `workflow_dispatch`/`workflow_call` only and run weekly through `weekly-full.yml`.
6. **Minimal, failure-only artifacts:** one small artifact per workflow (log tails, JSON, at most four 800px JPEGs), `compression-level: 9`, `retention-days: 1`, `if-no-files-found: ignore`; no `dist/`, source archives or videos. Do not add `continue-on-error` to upload steps or change deploy paths without the owner's decision.
7. **No Vercel tool calls.** Keep GitHub API calls few: no polling loops, no manual workflow triggers, stop on a 403/429.
8. **View the screenshots** (with the Read tool) before shipping any UI change; keep before/after images in the scratchpad, never in the repo.
9. **Save compatibility.** `almo7areboon.save.v1` (profile schema 5) and its backup keep their formats; new state is optional and normalized on load.
10. Share the browser machine politely: use this repo's own port, wrap heavy browser runs in `flock /tmp/browser.lock`, and stop your own servers.
