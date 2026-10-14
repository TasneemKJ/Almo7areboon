# Reference-games iterations ledger (40)

Plan: [REFERENCE-GAMES-2026-10-14.md](REFERENCE-GAMES-2026-10-14.md). One line per shipped iteration: n, title, reference, what changed, test. A continuation resumes after the last line.

- 01/40 · Herald banner and chapter title card · Kingdom Rush · New field herald (ui/field-herald.ts) stamps the chapter title and wave count across the sky as a battle starts; one line at a time, once per key per battle, still with reduced motion; new storybook-pass.css · test: tests/field-herald.test.ts
- 02/40 · Last-wave herald · Kingdom Rush · The herald announces 'The last wave comes · Hold the line' once when the final scheduled wave sets out · test: tests/field-herald.test.ts (last wave once)
- 03/40 · Harvest Moon finale · Clash Royale (double elixir) · Simulation doubles food gathering once the final wave has set out (game/finale.ts); waits shorten honestly; herald 'Harvest Moon' and a ×2 tag on the food readout · test: tests/harvest-moon.test.ts
