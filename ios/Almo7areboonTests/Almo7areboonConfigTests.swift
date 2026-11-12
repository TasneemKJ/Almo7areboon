import XCTest
import TasKit
@testable import Almo7areboon

/// المحاربون's side of the shared shell: the names players' phones will hold, the site in the bundle and
/// what may be served from it. The engine itself is tested in TasKit (tas-engine/ios).
final class Almo7areboonConfigTests: XCTestCase {
    private let config = TasGameConfig.almo7areboon

    func testThePersistedNamesNeverChange() {
        // Renaming any of these after release loses saves or cached purchases.
        XCTAssertEqual(config.gameURL.absoluteString, "almo7areboon://app/")
        XCTAssertEqual(config.handlerName, "almo7areboon")
        XCTAssertEqual(config.bridgeGlobal, "almoApp")
        XCTAssertEqual(config.bootGlobal, "__almoAppBoot")
        XCTAssertEqual(config.storagePrefix, "almo7areboon")
        XCTAssertEqual(TasSaveVault(config: config).fileURL.lastPathComponent, "almo7areboon-save-vault.json")
        XCTAssertEqual([config.ownedDefaultsKey, config.pricesDefaultsKey], ["store.owned", "store.prices"])
        XCTAssertEqual(config.primaryProductKey, "fullGame")
        XCTAssertEqual(Catalog.fullGame.productID, "Tas.Almo7areboon.fullGame")
        XCTAssertNil(config.gameCenter)
        XCTAssertEqual(config.webRoot, "game")
    }

    func testTheGamesOwnMessagesParse() {
        XCTAssertEqual(TasBridgeMessage.parse(["type": "buy", "data": ["id": "fullGame"]], config: config), .buy("fullGame"))
        for page in ["terms", "privacy", "support"] {
            XCTAssertEqual(TasBridgeMessage.parse(["type": "openURL", "data": ["page": page]], config: config), .openURL(page))
        }
        XCTAssertNil(TasBridgeMessage.parse(["type": "buy", "data": ["id": "gems"]], config: config), "only what the catalog sells")
        XCTAssertNil(TasBridgeMessage.parse(["type": "openURL", "data": ["page": "https://example.com"]], config: config))
    }

    func testTheBuiltSiteShipsInsideTheAppWithoutItsWebOnlyFiles() throws {
        let root = try XCTUnwrap(TasSchemeHandler.webRootURL(config: config), "the build phase copied dist/ to game/")
        let html = try String(contentsOf: root.appendingPathComponent("index.html"), encoding: .utf8)
        XCTAssertTrue(html.contains("type=\"module\""))
        let fm = FileManager.default
        XCTAssertFalse(fm.fileExists(atPath: root.appendingPathComponent("sw.js").path), "no service worker in the app")
        XCTAssertFalse(fm.fileExists(atPath: root.appendingPathComponent("manifest.webmanifest").path))
        let assets = try fm.contentsOfDirectory(atPath: root.appendingPathComponent("assets").path)
        let bundleJS = try assets.filter { $0.hasSuffix(".js") }.map { try String(contentsOf: root.appendingPathComponent("assets/\($0)"), encoding: .utf8) }.joined()
        XCTAssertTrue(bundleJS.contains("almo7areboon"), "the shipped game carries the app bridge")
        XCTAssertTrue(bundleJS.contains("__almoAppBoot"))
        XCTAssertTrue(bundleJS.contains("__almoFlushSave"))
        // Every file the site needs has a type the scheme handler serves.
        let files = fm.enumerator(at: root, includingPropertiesForKeys: nil)!.compactMap { $0 as? URL }.filter { !$0.hasDirectoryPath }
        for file in files {
            XCTAssertNotNil(TasSchemeHandler.mimeType(forPath: file.path), "\(file.lastPathComponent) would never be served")
        }
    }

    func testNothingOutsideTheSiteIsServed() {
        XCTAssertNil(TasSchemeHandler.file(for: URL(string: "almo7areboon://app/../Info.plist")!, config: config))
        XCTAssertNil(TasSchemeHandler.file(for: URL(string: "almo7areboon://elsewhere/index.html")!, config: config))
        XCTAssertNotNil(TasSchemeHandler.file(for: URL(string: "almo7areboon://app/")!, config: config))
    }

    func testSavingAnImageToPhotosDoesNotCrash() {
        // Without this key iOS kills the app when the player taps "Save Image" on the share sheet.
        let text = Bundle.main.object(forInfoDictionaryKey: "NSPhotoLibraryAddUsageDescription") as? String
        XCTAssertFalse((text ?? "").isEmpty)
    }

    func testLegalLinksAreReal() {
        XCTAssertEqual(config.legalPages["terms"], appleStandardEULA)
        XCTAssertEqual(config.legalPages["privacy"]?.absoluteString, "https://tas-games.vercel.app/almo7areboon/privacy.html")
        XCTAssertEqual(config.legalPages["support"]?.absoluteString, "https://tas-games.vercel.app/almo7areboon/support.html")
    }
}
