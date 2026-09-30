# Quality probes

Repeatable checks that read the running game rather than its source. They complement `npm test` (deterministic logic and source contracts) and catch what only shows up in a real browser. Every browser probe needs a preview server and accepts `CHROMIUM_PATH` to reuse an installed Chromium instead of the one Playwright downloads.

```sh
npm run build && npm run preview        # serves http://127.0.0.1:4173/
CHROMIUM_PATH=/path/to/chromium npm run review:overlap
```

| Command | What it checks | Exit code | Why it exists |
| --- | --- | --- | --- |
| `npm run review:browser`, `review:layering` | Portrait screenshots, geometry and frozen battlefield layering (used by CI) | 1 on failure | Original visual acceptance |
| `npm run review:monkey [url] [seconds]` | Starts on seven missing or damaged saves, runs one end-to-end evolution (chapter changes, coins and unlocks reset), then random taps, keys and button presses | 1 on any page error, failed start or wrong evolution result | Start-up and robustness regressions |
| `npm run review:overlap` | Fifteen HUD elements pairwise at six sizes (320–768px) with very large totals; Settings and Quests title contrast | 1 on overlap above 2px or an illegible title | Layout regressions; caught the cream-on-cream bug |
| `npm run review:clip` | Every text run on each screen and dialog at 320 and 390px against `overflow: hidden` ancestors and the viewport edge | 1 on cut-off text | Truncated labels; ignores content inside scrollers |
| `npm run review:contrast` | Text colour against the rendered pixels behind every text element (gradients and art included) | Always 0, read the list | Candidates for WCAG AA problems; partly hidden elements and containers with chips can be false positives, so confirm with a zoomed screenshot |
| `node --experimental-strip-types scripts/simulate-progression.ts [timeline] [summon] [attempts]` | A competent scripted player across many timelines | Prints JSON | Balance evidence; see [progression-wall.md](progression-wall.md) |
| `node --experimental-strip-types scripts/simulate-encounters.ts` | Authored encounter balance matrix | Prints JSONL | See [tactical-encounters-balance.md](tactical-encounters-balance.md) |

## Using them

- After a stylesheet or markup change, run `review:overlap`, `review:clip` and skim `review:contrast`.
- After touching saves, start-up or input handling, run `review:monkey`.
- A probe that reports nothing is only useful if it can fail: each of the exit-code probes was checked against a deliberately induced defect (a pause button moved onto the currency pill, oversized unit names, a global light text colour).
- None of the browser probes run in CI yet because they need a running preview and add several minutes; wiring them in after `npm run build` is a reasonable next step.
