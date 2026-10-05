# AGENTS.md

## Repository identity

Almo7areboon is a fictional Levantine dusk/storybook strategy game. Current `main` source, authored storybook art, original units/factions/eras, the `almo7areboon.save.v1` save key and the current migration/progression rules are authoritative.

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
