# Quests Result Return

## Observable gap

The connected Journey correctly preserves a finished battle receipt while the
player checks goals, cards, or story missions. Current source behavior breaks
that continuity only for Journey → All quests: closing Quests dismisses every
modal while the battle remains won or lost, hiding the Retry or Next decision
until the player discovers that tapping Battle restores it.

## IDEAL

- **Identity:** Journey, Quests, and results read as connected pages of the same
  storybook campaign rather than unrelated overlays.
- **Destination:** closing any secondary page opened over a held result returns
  to the unchanged result and its clear Retry or Next action.
- **Essence:** one predictable Close action; no extra prompt, copy, or menu.
- **Approach:** include Quests in the existing terminal-phase modal restoration
  rule already shared by Journey and Chronicle.
- **Limits:** no reward, receipt, save, pause, economy, input, art, audio, or
  progression changes; no new state or persistence.

## Five Ws

- **Who:** a player who opens All quests from Journey after winning or losing.
- **What:** Close restores the held result instead of exposing the battle shell.
- **When:** only while the authoritative battle phase is `won` or `lost`.
- **Where:** the existing modal dismissal owner in `src/main.ts`.
- **Why:** keep the post-battle decision visible and prevent a recoverable but
  confusing dead-end in the newly connected Journey flow.

## Acceptance

1. Journey → All quests → Close restores the same result for won and lost
   phases, preserving the pending receipt and profile byte-for-byte.
2. Quests opened outside a terminal battle still closes normally.
3. Existing session-conflict, manual-pause, focus, reward-claim, and result
   protections remain authoritative.
4. All source tests and production build pass.
5. GitHub Actions native Chromium captures the current-build Quests step at
   320×568 and 390×844 and proves Close returns to the result.
