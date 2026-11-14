//
//  Almo7areboonConfig.swift
//  Everything the shared iOS shell (TasKit, ../../tas-engine/ios, built against 040aa0e) needs to know about المحاربون.
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

    /// The Lamplighter (مُشعِل القناديل): a row of lanterns lit at your gate in every battle, only while
    /// the subscription is live. Pure light: no hitbox, no stats, no food, coins or speed. Yearly is level 1.
    static let lamplighterMonthly = TasCatalogItem(key: "lamplighterMonthly", productID: "Tas.Almo7areboon.lamplighter.monthly", kind: .subscription)
    static let lamplighterYearly = TasCatalogItem(key: "lamplighterYearly", productID: "Tas.Almo7areboon.lamplighter.yearly", kind: .subscription)

    /// What is on sale in this version.
    static let all: [TasCatalogItem] = [fullGame, lamplighterMonthly, lamplighterYearly]
    static var productIDs: [String] { all.map(\.productID) }
}

/// Game Center: what the page's progress script reports, mapped to the IDs in App Store Connect.
/// The script and the IDs come from ios/game-center/progress.js (its test checks this file matches).
/// Nothing paid counts. A player signed in on the phone is recognised silently; nobody is asked to sign in during play.
enum AlmoGameCenter {
    /// Evaluated in the page beside the save copy; reads the save (almo7areboon.save.v1) and guards every field.
    static let progressScript = "(function(){var o={achievements:{},scores:{}},s=null;try{s=JSON.parse(localStorage.getItem('almo7areboon.save.v1'));}catch(e){s=null;}var ob=function(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};var n=function(v){return typeof v==='number'&&isFinite(v)&&v>0?Math.floor(Math.min(v,1e12)):0;};s=ob(s);var a=o.achievements,u=Array.isArray(s.unlocked)?s.unlocked:[],m=ob(s.mastery),c=Array.isArray(m.chapters)?m.chapters:[];a.firstVictory=n(s.wins)>=1;a.oliveTerraces=n(s.furthestBattle)>=2;a.secondTroop=u[1]===true||u[2]===true;a.breadEnough=n(s.foodLevel)>=5;a.gateUnbroken=c.some(function(x){return (n(ob(x).earnedMask)&2)===2;});a.hundredBack=n(s.kills)>=100;a.lampsDoNotFight=n(ob(s.dusk).day)>=1;var k=n(s.kills);if(k>0)o.scores.rivalsTurnedBack=k;return o;})()"

    static let config = TasGameCenterConfig(
        progressScript: progressScript,
        achievements: [
            .init(key: "firstVictory", id: "almo.milestone.1_first_battle"),
            .init(key: "oliveTerraces", id: "almo.milestone.2_olive_terraces"),
            .init(key: "secondTroop", id: "almo.milestone.3_by_the_fire"),
            .init(key: "breadEnough", id: "almo.milestone.4_bread_enough"),
            .init(key: "gateUnbroken", id: "almo.milestone.5_gate_unbroken"),
            .init(key: "hundredBack", id: "almo.milestone.6_a_hundred_turned_back"),
            .init(key: "lampsDoNotFight", id: "almo.milestone.7_lamps_do_not_fight"),
        ],
        leaderboards: [.init(key: "rivalsTurnedBack", id: "almo.rivals_turned_back")]
    )
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
        gameCenter: AlmoGameCenter.config,
        legalPages: ["terms": appleStandardEULA, "privacy": SiteLinks.privacy, "support": SiteLinks.support,
                     "subscriptions": URL(string: "https://apps.apple.com/account/subscriptions")!],
        launchColor: UIColor(named: "LaunchBackground") ?? UIColor(red: 0.07, green: 0.11, blue: 0.16, alpha: 1),
        ambientAudio: true, // the silent switch silences the game
        shareDownloadedPNGs: true,
        debugJSDefaultsKey: "almoDebugJS" // `simctl launch … -almoDebugJS "…"`
    )
}
