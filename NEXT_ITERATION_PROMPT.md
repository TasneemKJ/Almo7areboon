# Next iteration prompt

Copy everything between the `---` lines into a message to the coding agent and replace the placeholder.

---

Read, in order: `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `DESIGN_RULES.md`, `DESIGN.md`, `UX-CONTRACT.md`, `TODO.md`. Confirm the rules and the current state, then run the iteration workflow from `AGENTS.md`.

## What I want to change

[Describe the change, or write "continue" to run a fresh audit and brainstorm round.]

## Standing rules (apply every time)

- Mobile first: touch-enabled Playwright at 320x568, 360x640, 390x844, 412x915 and 844x390, tap targets at least 44px, nothing clipped or horizontally scrolling, state kept across rotation and backgrounding, 4x CPU throttle check. A mobile failure blocks the PR.
- Captivating, ultra-professional visuals and UI/UX that fit the folk-tale battle world; view every screenshot as an art director and as a player mid-battle; fix the worst gaps first inside the existing art direction.
- Brainstorm 20 ideas each iteration (IDEAL + 5Ws) across the agreed lenses, pick a few that belong to the game, record them in `docs/audits/`.
- Local-first: tests and build locally, one push, one PR, one merge per verified batch (a `[skip ci]` backup push is fine at milestones).
- PR/deploy gate of two minutes or less (`verify`: build + `test:fast`); heavy suites manual or weekly.
- Minimal, failure-only artifacts (one small artifact per workflow, one-day retention); no Vercel calls; few GitHub calls.
- View the screenshots before shipping; keep them in the scratchpad.
- Preserve `almo7areboon.save.v1`; new state optional and normalized.
- Decide within the repo's rules without asking the owner; report blockers.

---
