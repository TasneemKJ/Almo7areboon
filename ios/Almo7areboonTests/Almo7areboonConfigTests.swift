import JavaScriptCore
import XCTest
import TasKit
@testable import SouqAlLayl

/// Souq's side of the shared shell: the names players' phones already hold, the page in the bundle,
/// and the Game Center mapping. The engine itself is tested in TasKit (tas-engine/ios).
final class SouqConfigTests: XCTestCase {
    private let config = TasGameConfig.souq

    func testThePersistedNamesNeverChange() {
        // Renaming any of these after release loses saves, cached purchases or Game Center state.
        XCTAssertEqual(config.gameURL.absoluteString, "souq://app/")
        XCTAssertEqual(config.handlerName, "souq")
        XCTAssertEqual(config.bridgeGlobal, "souqApp")
        XCTAssertEqual(config.bootGlobal, "__souqAppBoot")
        XCTAssertEqual(config.storagePrefix, "souq")
        XCTAssertEqual(TasSaveVault(config: config).fileURL.lastPathComponent, "souq-save-vault.json")
        XCTAssertEqual([config.ownedDefaultsKey, config.pricesDefaultsKey], ["store.owned", "store.prices"])
        XCTAssertEqual(config.gameCenter?.reportedDefaultsKey, "gcReported")
        XCTAssertEqual(config.gameCenter?.leaderboards.first?.defaultsKey, "gcBestNight")
        XCTAssertEqual(config.primaryProductKey, "fullSouq")
        XCTAssertEqual(config.debugJSDefaultsKey, "souqDebugJS")
    }

    func testTheGamesOwnMessagesParse() {
        XCTAssertEqual(TasBridgeMessage.parse(["type": "buy", "data": ["id": "fullSouq"]], config: config), .buy("fullSouq"))
        XCTAssertEqual(TasBridgeMessage.parse(["type": "openURL", "data": ["page": "terms"]], config: config), .openURL("terms"))
        XCTAssertEqual(TasBridgeMessage.parse(["type": "openURL", "data": ["page": "privacy"]], config: config), .openURL("privacy"))
        XCTAssertNil(TasBridgeMessage.parse(["type": "buy", "data": ["id": "coins"]], config: config), "only what the catalog sells")
        XCTAssertNil(TasBridgeMessage.parse(["type": "openURL", "data": ["page": "support"]], config: config))
    }

    func testOnlyTheGamePageIsServed() {
        XCTAssertEqual(TasSchemeHandler.resource(for: URL(string: "souq://app/")!, config: config), "souq-al-layl.html")
        XCTAssertEqual(TasSchemeHandler.resource(for: URL(string: "souq://app/souq-al-layl.html")!, config: config), "souq-al-layl.html")
        XCTAssertNil(TasSchemeHandler.resource(for: URL(string: "souq://app/../Info.plist")!, config: config))
    }

    func testTheGameShipsInsideTheApp() throws {
        let url = try XCTUnwrap(Bundle.main.url(forResource: "souq-al-layl", withExtension: "html"), "the build phase copied dist/souq-al-layl.html")
        let html = try String(contentsOf: url, encoding: .utf8)
        XCTAssertTrue(html.contains("const souqApp={"), "the shipped game carries the APP BRIDGE")
        XCTAssertTrue(html.contains("webkit.messageHandlers.souq"))
        XCTAssertTrue(html.contains("window.__souqAppBoot"))
    }

    func testThePostcardCanBeSavedToPhotosWithoutACrash() {
        // Without this key iOS kills the app when the player taps "Save Image" on the share sheet.
        let text = Bundle.main.object(forInfoDictionaryKey: "NSPhotoLibraryAddUsageDescription") as? String
        XCTAssertFalse((text ?? "").isEmpty)
    }

    func testLegalLinksAreReal() {
        XCTAssertEqual(config.legalPages["terms"]?.host, "www.apple.com")
        XCTAssertEqual(config.legalPages["privacy"]?.absoluteString, "https://tas-games.vercel.app/souq-al-layl/privacy.html")
        XCTAssertEqual(SiteLinks.support.absoluteString, "https://tas-games.vercel.app/souq-al-layl/support.html")
    }

    /// The progress script, run in JavaScriptCore against a page shaped like Souq's.
    private func progress(_ page: String) throws -> TasGameProgress? {
        let js = JSContext()!
        js.evaluateScript("var localStorage={length:0,key:function(){return null;}};" + page)
        let text = try XCTUnwrap(js.evaluateScript(TasBootScripts(config: config).snapshot).toString())
        return try JSONDecoder().decode(TasPageSnapshot.self, from: Data(text.utf8)).progress
    }

    func testProgressFollowsTheMilestonesThePortAndTheBestNight() throws {
        let p = try XCTUnwrap(progress("""
        var MILESTONES=[{done:function(){return true;}},{done:function(){return 1;}},{done:function(){throw 1;}},
          {done:function(){return false;}},{done:function(){return false;}},{done:function(){return false;}}];
        var state={expansionUnlocked:true,bestNightServed:41.7}; function portOpen(){return false;}
        """))
        XCTAssertEqual(p.achievements["milestone.1"], true)
        XCTAssertEqual(p.achievements["milestone.2"], true)
        XCTAssertEqual(p.achievements["milestone.3"], false, "a milestone that throws is not done")
        XCTAssertEqual(p.achievements["port"], false, "portOpen() decides, not the save flag (Full Souq)")
        XCTAssertEqual(p.scores["bestNight"], 41)
        XCTAssertNil(try progress("var state={};"), "no MILESTONES: no progress, and no throw")
    }

    @MainActor
    func testAchievementsFollowTheMilestonesAndAreSentOnce() {
        let defaults = UserDefaults(suiteName: "gc-\(UUID().uuidString)")!
        let gc = TasGameCenterReporter(config: .souq, defaults: defaults)
        var flags = Dictionary(uniqueKeysWithValues: (1...6).map { ("milestone.\($0)", $0 <= 2) })
        flags["port"] = true
        let progress = TasGameProgress(achievements: flags, scores: ["bestNight": 10])
        XCTAssertEqual(gc.newAchievements(in: progress), ["souq.milestone.1", "souq.milestone.2", "souq.port"])
        defaults.set(["souq.milestone.1"], forKey: "gcReported")
        XCTAssertEqual(gc.newAchievements(in: progress), ["souq.milestone.2", "souq.port"])
        XCTAssertEqual(gc.newScores(in: progress).map(\.leaderboard.id), ["souq.bestNight"])
        defaults.set(10, forKey: "gcBestNight")
        XCTAssertTrue(gc.newScores(in: progress).isEmpty, "an install that already sent its best keeps it")
    }
}
