# Levantine dusk implementation plan

> Execute inline with Superpowers executing-plans and test-driven-development. User explicitly authorized ongoing refinement without further intervention, no scheduler, and regular GitHub commits.

Goal: make the approved Levantine direction visible in the shipped character art and settings, with restrained dread rather than generic horror.
Spec: ../specs/2026-09-29-levantine-visual-overhaul.md, extended by the user's September 29 requests for dread/atmosphere and regular commits.
Architecture: keep stable asset exports and the existing ground/foreground mapping. New drawing helpers own only presentation; gameplay and storage stay untouched. Original SVG source is rasterized through the existing Phaser manifest. No new product dependencies.

## Constraints
- Preserve src/game byte-for-byte, action IDs, pause ownership, reduced motion, saved progression and CI gates.
- No browser access workaround, deployment request, merge, scheduler or fabricated in-game screenshots.
- Images from source rasterization are ASSET QA. Distinguish implementation from rendered acceptance and do not claim 40 cycles from one batch.
- Commit coherent verified batches through the connected GitHub integration, with current-head checks and exact tree comparison.

## Tasks
1. **Character wardrobe and expression.** Add a typed six-chapter clothing/skin helper in src/view/levantine-wardrobe.ts. Replace existing torso/headwear construction in unit-illustrations.ts; retain feet, weapon animation and faction colors. Test faction-neutral skin, six distinct garments, integration in all portraits/atlases, no external assets, and bounded rendered poses. Run new tests RED, implement, run the entire suite/build and existing raster QA; review before/after boards; commit.
2. **Levantine dusk scenery and bases.** Replace generic landmarks with six original fictional settings grounded in documented terraces, courtyards and local stone traditions. Keep 900x1000 world ground at 660 and the 450x220 transparent foreground strip at source y=560. Keep warm light away from the combat lane, no sacred or real-conflict targets. Tests pin six source-world compositions, layer separation, clear lane mask, base anchors and manifest pixel budget. Review source-art contact sheets and commit after full checks.
3. **Atmospheric presentation and chapter naming.** Add presentation-only chapter/unit names, consistent across selectors, evolution and main HUD; no internal era changes. Carry indigo/olive/warm-light palette into UI without more panels. Verify actual prices/gates and stable action IDs, portrait contrast/spacing source contracts and full tests/build. Commit and update PR evidence.

## Review focus
- All six attack poses remain inside their cell and match standalone art (raster QA).
- Player/enemy skin and facial geometry are equal except faction trim (unit-output checks).
- Foreground cannot cover the central road (alpha-mask QA).
- Unknown era values use safe first-chapter fallbacks (unit tests).
- Every displayed new chapter name is presentation-only and preserves existing evolution and spending gates (template and simulation regressions).

Ruling: the new no-intervention request supersedes repeated approval prompts. Earlier interrupted preview boards are not current source evidence. Resume from the verified artifact, not invented unpublished code.
