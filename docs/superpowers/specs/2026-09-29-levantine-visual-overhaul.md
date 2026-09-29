# Almo7areboon — Levantine visual-overhaul design

Date: 2026-09-29
Starting revision: d022550bff2bfe528988b0e3a87b9a3ecc44a8d3
Working branch: feat/levantine-visual-40

## User direction and status

The user requested 40 substantial visual iterations, approved the characters-first overhaul, and then added: "Also i want levantine". Levantine identity is therefore a core requirement for the new visual work, not an optional Arabic-label treatment.

This document records that revised design. It contains no implemented visual changes and counts as zero completed iterations. Previously merged work is the baseline, not part of the new 40. The unmerged motion candidate fcfab3224cbad588f272c0c48a563166031e48ad must be reviewed separately against current source; it is not included by this document.

The new cultural direction supersedes the original specification's visual-fidelity priority where they conflict. Preserve the food/deployment battle loop and tested progression; develop an original Levantine presentation rather than reproduce the reference game's exact art.

## Intended experience

A lively, polished, portrait-first strategy game whose world is recognizably rooted in the Levant before any text is read. For this project, the reference scope will include Jordanian, Palestinian, Lebanese and Syrian settings and craft traditions. These are separate sources, not interchangeable costumes or a claim that all places share one identity.

Maintain approachable stylized characters, readable faction colors and the existing parchment, enamel-blue and brass foundation. Avoid caricature, generic desert-fantasy shorthand, and ornament that hides the battlefield. Architecture, vegetation, tools, textiles, expressions and sound should establish a coherent setting together.

## Characters first

Rework silhouettes, facial expression, proportions, layered clothing, equipment, pose and movement at actual battle and portrait scale. Convey identity through specific dress, craft and environmental context, not a supposed single Levantine facial appearance. Vary faces, hair and complexions without making appearance a faction's moral code.

Use researched garment and armor references appropriate to the scene and period. Place embroidery, sashes, woven trim and head coverings selectively; do not put the same modern scarf or costume on every era. Palestinian embroidery needs its own source attribution and context, not reuse as an unnamed pan-regional pattern. Keep melee, ranged and heavy roles recognizable at a glance. Maintain blue/coral faction identification without assigning real populations to the enemy side.

## Environments and material language

Replace generic scenery with composed regional environments: terraced olive-and-vine country, stone settlements, courtyards, coastal trading towns, mountain landscapes and workshops. Select a specific place and period reference for each scene before drawing. Stone color, roof construction, vegetation and building detail must agree within that scene; do not combine unrelated landmarks simply to fill the frame.

Use chalky stone, olive greens, warm clay, indigo/enamel accents, worked wood and restrained brass as the design palette. These are proposed art choices, not claims that all regional buildings use those materials. Give water channels, presses, baskets, pottery, carved doors and shaded thresholds plausible placement and visual purpose. Religious buildings and sacred writing must not become generic destructible decoration.

Three initial source anchors are already checked: Battir's terraces and olive/vine cultivation for agricultural composition; the documented local significance of Palestinian embroidery for textile treatment; and an eighteenth-century mother-of-pearl-inlaid chest attributed to Damascus for crafted wood surfaces. The references guide new original artwork; photographs and protected designs are not copied into the game.

## Six-era continuity

Keep the six internal era slots, progression state, prices and battle rules. Proposed visual settings are early settlements, farming communities, Levantine antiquity, historic craft towns, an imagined modern Levant and an imagined Levantine future. These are artistic chapter directions, not a single authoritative chronology.

Any renamed chapter or unit label belongs in a presentation mapping while existing save and action identifiers remain stable. Research named historical equipment before adoption. Do not transplant medieval or modern motifs into prehistory and call it accurate. Existing dinosaur cavalry is explicitly fantasy if retained. The modern chapter uses fictional factions rather than reenacting an ongoing conflict. The future chapter carries courtyard forms, local materials and textile geometry forward instead of abandoning the identity for generic alien imagery.

## Interface, language and sound

Apply craft-inspired detail to portrait frames, collectible cards, evolution panels and result screens without increasing persistent menu clutter. Use inlay and textile borders sparingly, with sufficient contrast and space for names, prices and state indicators. The battlefield remains the primary view.

Proposed language default, not an already implemented feature: readable Arabic interface labels with proper right-to-left layout; light Levantine phrasing for optional character reactions; an English option. Keep numeric values and mixed-direction text legible. Localization must not reverse faction ownership, world coordinates or control meaning. Localize carefully rather than treating all regional dialects as identical.

Proposed audio direction: original music using oud-, ney- and hand-percussion-inspired timbres, plus scene-appropriate birds, water, market distance and stone/wood footsteps. Avoid generic exotic sound cues, unlicensed recordings and invented claims of authentic instrumental performance. Honor mute, gesture-start, pause and visibility ownership. Music and voice work require their own audio verification, not merely visual asset tests.

## Technical and review boundaries

Continue TypeScript, Phaser and DOM presentation. Concentrate art changes in src/view, presentation templates and styles in src/ui, and narrowly scoped wiring in src/main.ts. Keep simulation, economy, rewards, save compatibility, action IDs and pause behavior unchanged. New localization preferences must be isolated and tested if implemented.

Count a cycle only when an observed issue leads to a meaningful player-visible change and documented verification. A test, asset export, tiny constant change, design document or repeated audit is not an independent visual iteration. Track implementation status separately from rendered acceptance. Forty remains a requested target, not a claim of completion.

For each connected batch: inspect before/after evidence, test affected behavior, run the full existing test suite and production build, check bounded effects/texture memory, and verify the uploaded source matches tested bytes. Review small-phone portrait first, then larger portrait, short landscape and desktop when permitted. Preserve reduced motion, readable text, separated portrait bands and touch targets.

The previously blocked browser route must not be bypassed. Standalone rasterized source art is permitted asset QA, not a game screenshot or proof of touch, Safari, actual DOM geometry or frame rate. Rendered release gates remain open until genuine permitted evidence exists. Do not merge or deploy this new branch without the user's direction. Do not restart a scheduler implicitly.

## Source anchors

- UNESCO, The art of embroidery in Palestine, practices, skills, knowledge and rituals: https://ich.unesco.org/en/RL/the-art-of-embroidery-in-palestine-practices-skills-knowledge-and-rituals-01722
- UNESCO World Heritage Centre, Palestine: Land of Olives and Vines — Cultural Landscape of Southern Jerusalem, Battir: https://whc.unesco.org/en/list/1492
- The Metropolitan Museum of Art, Chest, eighteenth century, attributed to Syria, Damascus, object 18.45.2: https://www.metmuseum.org/art/collection/search/447052

These references establish initial art grounding only. They do not authenticate every proposed scene, historical label, costume or musical choice. Add scene-specific sources before claiming historical accuracy.
