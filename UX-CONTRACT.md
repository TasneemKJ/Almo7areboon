# Shared game interaction contract

See DESIGN.md for visual intent. English/en-US numbers and device-local calendar days are the existing locale contract. Gameplay and rewards are deterministic client-side state; no real-money transactions or backend calls.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Controls | Native buttons/radios in main.ts and ui templates | guarded Game.dispatch | deployment, skill, order, reward | source integration and browser tap |
| Modal | main showModal/closeModal, accessibility.ts | modal/pause ownership | result, Journey, Settings, session | focus/close hit tests and native playtest |
| Toast | main toast/status live region | action result | info and recoverable errors | main tests and browser |
| Scrollbar | style.css/continuation.css/battle-banner.css | shell + dialog viewport | short-phone shell scroll, independent dialog | narrow/rotated browser hit tests |
| Navigation | main switchTab and modal dispatch | activeTab, pendingVictory | ready/result Journey → collection or Chronicle | receipt/manual-pause regressions |
| Rewards | Game.dispatch claim/daily and data.ts | saved claimed IDs/localDay | Journey or Quests presentation | duplicate/roundtrip claims |

Order cast validates session ownership, phase, pause, valid ID, charge and non-overlap before spending60. Invalid casts do nothing.10 simulation seconds freeze with any pause reason; no wall-clock callbacks. Retry/reload create uncharged inactive orders. Strength is never stored in a profile. Older pending receipts normalize optional order counts to0.

Journey reads current profile only and never awards by rendering. Claim dispatch uses existing quest IDs/payouts; successful claim redraws its originating Journey, failed/conflicted saves leave session recovery authoritative. Journey from a battle result retains pendingVictory; Close restores that result. Direct Cards navigation closes Journey but retains the receipt and manual pause. Returning to Battle restores the held result without reissuing rewards; preparation links appear only before settlement. Chronicle mission changes use their existing ready/result validity rules.

Menus pause simulation without clearing manual pause. Hidden tabs, orientation, save conflicts, future saves and temporary sessions preserve existing lifecycle policies. The game asks before import replacement/start-over/prestige; user preferences on that established flow remain.

All new controls have semantic names,44px minimum, visible keyboard focus and non-color state labels. Gauge/countdowns are not noisy live regions; successful state changes use existing feedback. Reduced motion keeps strength/duration and static order identity. Offline first-return acceptance records actual worker responses and driver limitations separately from physical iOS/Android acceptance.
