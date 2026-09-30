# Similar games: lessons for Almo7areboon

Research checked 2026-09-30 (Asia/Amman). Mechanics below come from publisher descriptions and official game pages. Proposed applications are our design inferences, not evidence of retention uplift. No competitor assets, code, or proprietary balancing tables are used.

| Reference | Observed mechanic | Application |
| --- | --- | --- |
| [We Are Warriors](https://play.google.com/store/apps/details?hl=en&id=com.vjsjlqvlmp.wearewarriors) | Food produces troops; new eras introduce different armies. | Evolution needs a visible payoff and useful choices soon afterward. The following economy pass preserves chapter access and measures time to the next purchase. |
| [The Battle Cats](https://play.google.com/store/apps/details?hl=en&id=jp.co.ponos.battlecatsen) | Tap deployment, squad selection, a defensive cannon, and stage rewards leading to character evolution. | Keep controls simple; make troop specialties, emergency skill timing, and quirky character identity carry the depth. |
| [Age of War](https://play.google.com/store/apps/details?hl=en&id=com.maxgames.ageofwar1) | Successive ages change units and defenses while the player races the enemy's advancement. | Build anticipation with distinct encounters and an explicit final threat. Additional turrets are outside this iteration. |
| [Bad North press kit](https://www.badnorth.com/press-kit) and [official publisher listing](https://apps.apple.com/us/app/bad-north/id1441005816?mt=12) | Automatic soldiers respond to high-level commands; its later update added enemy previews, checkpoints, and more controlled campaign gold. | Prioritize readable threats, deliberate composition, predictable reward opportunities, and preserved progress when experimenting. |
| [Kingdom Two Crowns](https://kingdomthegame.com/kingdom-two-crowns/) | Minimalist strategy combines inhabitants, construction, defense, exploration, and distinct themed settings. | Tie atmosphere to what players protect: inhabited windows, anchored lamps, and a village that reacts to pressure and recovery. |

## Current implementation decisions

1. Author six encounter schedules with visible upcoming composition. Keep automatic movement and three deployment controls.
2. Add guard, pierce, and sweep specialties with resolved visual feedback. Compare fixed and threat-aware deployment through reproducible public actions.
3. Preserve unlocked battles through evolution; give optional chapter accomplishments finite, understandable rewards in existing screens.
4. Add village activity measured against the actual paintings, and a restrained soundscape response. Respect sound settings, reduced motion, and mobile bounds.

These references do not justify adding daily gates, currencies, sprawling collections, or purchasing pressure. Evaluate actual battle duration, first-purchase timing, optional replay goals, visual readability, and save integrity in this game. Longer-term retention remains unmeasured without player observations.

## Self-teaching and personality follow-up

Rechecked official sources on 2026-09-30: [PONOS Battle Cats](https://www.ponos.jp/en/games/thebattlecats/), [Kingdom: New Lands](https://kingdomthegame.com/kingdom-new-lands-2/), and [Supergiant Hades FAQ](https://www.supergiantgames.com/blog/hades-faq/). PONOS emphasizes tap deployment and a simple base-destruction loop. Kingdom describes discovery and understanding how pieces form a strategy. Supergiant describes varied runs, permanent progression and story/character discovery.

Design inference: teach start → food → deployment immediately, make deeper help optional and repeatable, and expose actual target/timing feedback on existing controls. Let result dialogue give the villages a recognizable voice. Future village response variety should follow real events and permanent progress, without inventing rewards or turning tutorial dismissal into a progression gate. These are design hypotheses; neither descriptions nor implementation demonstrate retention uplift.
