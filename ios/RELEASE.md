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
Full Journey: play the first two chapters (or open **Settings → Full Journey**); evolving past chapter 2 shows the
card with the price, Restore purchases, Terms of Use and Privacy. The game has no accounts and collects no data.

## Before external testing
First ten minutes on a real iPhone in Arabic and English; buy Full Journey with a sandbox account; Restore; Ask to
Buy (approve and decline); airplane-mode relaunch; Export and Import a save; delete and reinstall (the vault restores
the save on the first launch only when iOS cleared every `almo7areboon.*` key).
