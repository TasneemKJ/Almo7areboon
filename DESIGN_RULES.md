# Design rules

Use these when changing `DESIGN.md`, `UX-CONTRACT.md` or any player-facing behavior.

## Target player
A casual-to-midcore phone player in short sessions, comfortable with lane battle games (We Are Warriors!-style loop) and light collection. Prefer readable feedback and learnable depth over hidden complexity.

## Principles
1. **Mobile first.** One-thumb portrait play; controls at least 44px; the battlefield stays uncovered; landscape and desktop must not break.
2. **Combat clarity leads.** Anything that competes with the battle for attention in running play needs a reason; surrounding menus use the world's materials (paper, brass, navy).
3. **Teach by playing.** Prefer one live cue at the moment of need (`teachOnce`-style, highlight, result hint) over text walls.
4. **Honest rewards.** Show real earnings and real progress; no reward promises the simulation does not pay, no coercive timers or streak punishment copy, no unmeasured retention claims.
5. **A loss is a lesson.** A defeat keeps earned coins and names one supported next step.
6. **No dominant strategy.** Check each upgrade, card and order against a simple "always do this" line.
7. **Folk-tale tone.** Warm, restrained, Levantine dusk; humor and dread only where the setting earns them; original art, not exact historical reconstruction.
8. **Accessible by default.** Native controls, visible keyboard focus, non-color state labels, reduced motion keeps strength and meaning, text readable at 200% root size.
9. **Saves are sacred.** Never change a key or break an old save; add optional normalized fields.
10. **Evidence over claims.** Screenshots and browser runs prove only their environment; physical-device, Safari and low-end performance stay separate.

If a change passes, say it was checked against these rules; if it conflicts, record the override next to the affected section of `DESIGN.md`.
