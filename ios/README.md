# المحاربون · Almo7areboon for iPhone

A thin native shell around the web game, on **TasKit** (`../../tas-engine/ios`, the shared Tas Games engine,
built and tested against tas-engine `040aa0e` (branch feat/web-root: folder mode and live subscriptions)). The game is the Vite build in `dist/`; the "Copy the game" build
phase copies it into the app as the folder `game/` (without the service worker, the web manifest and the web icons),
and TasKit's folder mode serves it offline at `almo7areboon://app/`.

```
src/ ──npm run build──▶ dist/ ──Xcode "Copy the game"──▶ Almo7areboon.app/game/ ──TasKit──▶ almo7areboon://app/
ios/Almo7areboon
 ├─ Almo7areboonApp.swift      SwiftUI entry: TasGameScreen(host: TasGameHost(config: .almo7areboon))
 └─ Almo7areboonConfig.swift   the persisted names, the catalog (Full Journey, the Lamplighter), the legal pages
ios/Almo7areboonTests
 ├─ Almo7areboonConfigTests    names, messages, the site in the bundle (no web-only files, every type served)
 ├─ StoreTests                 Full Journey and the Lamplighter against Almo7areboon.storekit (buy, cache, refund,
 │                              Ask to Buy; subscription expiry, refund, upgrade, grace, one group, manage sheet)
 └─ GamePageIntegrationTests   the real build in a real web view: in the app, battlefield loads offline,
                               locked until bought, the card fits 390×844 with 44pt controls in EN and AR
```

## Build and test

```bash
npm ci && npm run build          # at the repo root: dist/
open ios/Almo7areboon.xcodeproj  # needs ../tas-engine checked out beside this repo
xcodebuild -project ios/Almo7areboon.xcodeproj -scheme Almo7areboon \
  -destination 'platform=iOS Simulator,name=Almo7areboon 6.9' test
```

Debug builds run one line of JavaScript after load: `xcrun simctl launch booted Tas.Almo7areboon -almoDebugJS "…"`.

## The page side

`src/ui/app-bridge.ts` (the vendored `src/vendor/tas-bridge.js` under this app's names): `almoApp.owns('fullGame')`,
`almoApp.buy('fullGame')`, `almoApp.buy('lamplighterYearly')`, `almoApp.restore()`,
`almoApp.openPage('terms'|'privacy'|'support')`, `almoApp.post('manageSubscriptions')`. The store flow is
`src/app/store-flow.ts` (cards, gates, refresh at boot, save flush); the cards are `src/ui/full-journey-screen.ts` and
`src/ui/lamplighter-screen.ts`; the lanterns are `src/view/gate-lanterns.ts`. Off the app
everything is open, so the web build is unchanged. `window.__almoFlushSave` is the guarded save writer the app calls
before copying the save keys (`almo7areboon.*`) to its vault.

## Rules

- **Persisted names never change**: scheme `almo7areboon`, storage prefix `almo7areboon`, vault
  `almo7areboon-save-vault.json`, UserDefaults `store.owned` / `store.prices`, product `Tas.Almo7areboon.fullGame`.
- **Swift owns what was bought.** Purchases never enter the save.
- **Nothing that gives power is sold.** Full Journey opens chapters 3-6 and the harder timeline; gems, cards and coins
  are earned in play only. The Lamplighter sells light: three lanterns behind your gate, no number changed.
- **Two languages, one per screen** (`docs/i18n.md`); the App Store listing is Arabic first, with English.

## Decisions (owner, 2026-11-13)

| Question | Decision |
|---|---|
| Shape | TasKit (the Souq shell, extracted) in folder mode; no Capacitor, no rewrite |
| Name | «المحاربون · Almo7areboon», bundle `Tas.Almo7areboon`, primary language Arabic |
| Languages | Arabic and English before 1.0 |
| Pay model | Free; **Full Journey** (non-consumable, US$4.99 tier) after chapter 2 |
| Subscription (2026-11-13) | **The Lamplighter** `Tas.Almo7areboon.lamplighter.monthly` US$1.99 / `.yearly` US$14.99, one group, yearly level 1; lanterns lit behind your gate (presence, not power) |
| Age rating | Honest 9+ (mild cartoon/fantasy violence), not 4+ |
| Game Center | Not in 1.0 |
| Orientation | Portrait only on iPhone (the web keeps landscape) |
