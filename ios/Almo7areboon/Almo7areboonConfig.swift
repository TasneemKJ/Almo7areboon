//
//  Almo7areboonConfig.swift
//  Everything the shared iOS shell (TasKit, ../../tas-engine/ios) needs to know about المحاربون.
//  The names below are persisted on players' phones (the almo7areboon:// origin holds the save,
//  the UserDefaults keys hold the cached purchase): never rename them after release.
//
//  To add a product: add it to `Catalog`, create the same product ID in App Store Connect and in
//  Almo7areboonTests/Almo7areboon.storekit, and let the game ask `almoApp.owns('<key>')`.
//

import Foundation
import TasKit
import UIKit

/// The Tas Games site (its own repo, `tas-games`). Change here if the site moves to its own domain.
enum SiteLinks {
    static let base = URL(string: "https://tas-games.vercel.app/")!
    static let privacy = base.appendingPathComponent("almo7areboon/privacy.html")
    static let support = base.appendingPathComponent("almo7areboon/support.html")
}

enum Catalog {
    /// The whole journey: every chapter after the second, and the harder timeline.
    static let fullGame = TasCatalogItem(key: "fullGame", productID: "Tas.Almo7areboon.fullGame", kind: .nonConsumable)

    /// What is on sale in this version.
    static let all: [TasCatalogItem] = [fullGame]
    static var productIDs: [String] { all.map(\.productID) }
}

extension TasGameConfig {
    static let almo7areboon = TasGameConfig(
        htmlFileName: "index.html",
        webRoot: "game",
        scheme: "almo7areboon",
        host: "app",
        handlerName: "almo7areboon",
        bridgeGlobal: "almoApp",
        bootGlobal: "__almoAppBoot",
        storagePrefix: "almo7areboon",
        vaultFileName: "almo7areboon-save-vault.json",
        // The page's own guarded writer (src/app/app-bridge.ts): writes nothing before a save exists.
        flushSaveScript: "if(typeof window.__almoFlushSave==='function')window.__almoFlushSave();",
        catalog: Catalog.all,
        primaryProductKey: Catalog.fullGame.key,
        ownedDefaultsKey: "store.owned",
        pricesDefaultsKey: "store.prices",
        gameCenter: nil,
        legalPages: ["terms": appleStandardEULA, "privacy": SiteLinks.privacy, "support": SiteLinks.support],
        launchColor: UIColor(named: "LaunchBackground") ?? UIColor(red: 0.07, green: 0.11, blue: 0.16, alpha: 1),
        ambientAudio: true, // the silent switch silences the game
        shareDownloadedPNGs: true,
        debugJSDefaultsKey: "almoDebugJS" // `simctl launch … -almoDebugJS "…"`
    )
}
