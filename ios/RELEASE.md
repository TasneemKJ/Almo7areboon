# Releasing المحاربون · Almo7areboon (iPhone)

App Store Connect bundle `Tas.Almo7areboon`, team `FJ3FMYPK3P`. The checklist is TasKit's
(`tas-engine/toolkit/release/README.md`); this page holds this app's specifics.

## Signing
- Profile **Almo7areboon AppStore (API)** (IOS_APP_STORE, Apple Distribution certificate `2PFCH5WWG4`), expires
  2027-11-07 with the certificate: renew both before then. Export with `ios/ExportOptions.plist` (manual signing:
  the App Manager API key cannot use cloud-managed signing).

## Upload
From a clean worktree at a pushed commit, with `../tas-engine` beside it:
```bash
npm ci && npm run build
K=~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8
AUTH="-authenticationKeyPath $K -authenticationKeyID <KEY_ID> -authenticationKeyIssuerID <ISSUER_ID>"
xcodebuild archive -project ios/Almo7areboon.xcodeproj -scheme Almo7areboon -configuration Release \
  -destination 'generic/platform=iOS' -archivePath Almo7areboon-<ver>b<n>.xcarchive CURRENT_PROJECT_VERSION=<n> \
  -allowProvisioningUpdates $AUTH
xcodebuild -exportArchive -archivePath Almo7areboon-<ver>b<n>.xcarchive -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath export-<n> $AUTH
```

## Review notes
The full text is `ios/store/listing.json` → `reviewNotes`. Full Journey: chapters 1 to 3 are free (1.3; through 1.2 it
was chapters 1 and 2). Play the first three chapters (or open **Settings → Full Journey**); going on to chapter 4 or
moving camp past chapter 3 shows the card with the price, Restore purchases, Terms of Use and Privacy. The Lamplighter: **Settings → The Lamplighter** (lengths, prices, renewal and
cancel line, Restore, Terms, Privacy; Manage subscription while subscribed). The game has no accounts and collects no
data. IAP review screenshots: `ios/store/review/store-card.png`, `ios/store/review/lamplighter-card.png`.

## tas-games lines to update (not edited from this repo)
The Lamplighter (2026-11-13) makes these lines in `tas-games` untrue; the market sheet changed the store name,
subtitle and keywords. Make tas-games match `ios/store/listing.json`:
- `store/almo7areboon/listing.json`: en-US `name` → "Almo7areboon: The Warriors"; both `subtitle`s and `keywords`;
  the description's "No ads, no timers, nothing else to buy." / «ولا شيء آخر للشراء» (add the Lamplighter paragraph
  and the renewal line); `iap` → a list with the two subscriptions and the group «مُشعِل القناديل» / The Lamplighter;
  Full Journey en description "Every later chapter and the harder timeline"; `reviewNotes` (the subscription, native
  features); `ageRating` → 9+ expected.
- `almo7areboon/index.html`: "Price: Free, with one optional purchase: Full Journey" / «مع شراء واحد اختياري» and
  "Full Journey is one optional purchase…" → mention the optional Lamplighter subscription.
- `almo7areboon/support.html`: add "How do I cancel the Lamplighter?" (Settings → The Lamplighter → Manage
  subscription, or the Apple Account's Subscriptions) and Restore for subscriptions.
- `almo7areboon/privacy.html`: unchanged in substance (purchases and subscriptions are handled by Apple).

## Before external testing
First ten minutes on a real iPhone in Arabic and English; buy Full Journey with a sandbox account; Restore; Ask to
Buy (approve and decline); airplane-mode relaunch; Export and Import a save; delete and reinstall (the vault restores
the save on the first launch only when iOS cleared every `almo7areboon.*` key).
