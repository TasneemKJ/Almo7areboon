import StoreKit
import StoreKitTest
import WebKit
import XCTest
import TasKit
@testable import SouqAlLayl

/// The shipped game, in a real web view served from souq://, talking to the real host and a
/// local StoreKit session: the page is in the app, locked until bought, and opens the Port after.
@MainActor
final class GamePageIntegrationTests: XCTestCase {
    private var session: SKTestSession!
    private var dir: URL!
    private var host: TasGameHost!
    private var web: WKWebView!
    private var window: UIWindow!

    override func setUp() async throws {
        session = try SKTestSession(configurationFileNamed: "SouqAlLayl")
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        for _ in 0..<120 {
            if let found = try? await Product.products(for: Catalog.productIDs), !found.isEmpty { break }
            try await Task.sleep(for: .milliseconds(250))
        }
        dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let defaults = UserDefaults(suiteName: "page-\(UUID().uuidString)")!
        host = TasGameHost(config: .souq, store: TasStore(config: .souq, defaults: defaults),
                           vault: TasSaveVault(config: .souq, directory: dir),
                           gameCenter: TasGameCenterReporter(config: .souq, defaults: defaults))
        web = host.makeWebView()
        window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.addSubview(web)
        web.frame = window.bounds
        window.isHidden = false
        try await waitFor("typeof souqApp==='object'&&typeof state==='object'&&document.readyState==='complete'")
    }

    override func tearDown() async throws {
        window?.isHidden = true
        try? FileManager.default.removeItem(at: dir)
    }

    private func js(_ source: String) async throws -> Any? {
        try await web.evaluateJavaScript(source)
    }

    private func waitFor(_ condition: String, seconds: Double = 20, file: StaticString = #filePath, line: UInt = #line) async throws {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            if (try? await js("Boolean(\(condition))")) as? Bool == true { return }
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTFail("timed out waiting for: \(condition)", file: file, line: line)
    }

    func testTheGameRunsInTheAppAndKnowsIt() async throws {
        let v1 = try await js("souqApp.inApp") as? Bool

        XCTAssertEqual(v1, true)
        let v2 = try await js("location.protocol") as? String

        XCTAssertEqual(v2, "souq:")
        let v3 = try await js("typeof navigator.vibrate") as? String

        XCTAssertEqual(v3, "function", "haptics reach the Taptic Engine")
        let v4 = try await js("document.getElementById('homeFullSouq').hidden") as? Bool

        XCTAssertEqual(v4, false, "Preferences offers Full Souq")
        let v5 = try await js("souqApp.owns('fullSouq')") as? Bool

        XCTAssertEqual(v5, false, "locked until bought")
        try await waitFor("souqApp.price.length>0") // the App Store's own price reached the card
    }

    func testBuyingFullSouqOpensThePortWithoutGems() async throws {
        // Not bought: the gate asks the App Store and leaves the gems alone.
        _ = try await js("state.prestigeCount=1;state.gems=0;state.expansionUnlocked=false;true")
        let v6 = try await js("portNeedsPurchase()") as? Bool

        XCTAssertEqual(v6, true)

        await host.store.buy("fullSouq")
        XCTAssertTrue(host.store.owns("fullSouq"))
        try await waitFor("souqApp.owns('fullSouq')===true") // Swift told the page

        _ = try await js("doExpand();true")
        let v7 = try await js("state.expansionUnlocked") as? Bool

        XCTAssertEqual(v7, true)
        // With 0 gems a charged gate returns early, so an open gate is the waiver. (The Port's own
        // challenge then pays its usual gem reward, so the purse is not checked for 0.)
    }

    /// The Full Souq card in both languages: every control a 44pt target, all of it on a 390×844
    /// screen. Snapshots go to the test's temporary folder for a person to look at.
    func testTheFullSouqCardFitsAndEveryControlIsATapTarget() async throws {
        try await waitFor("souqApp.price.length>0")
        for lang in ["en", "ar"] {
            _ = try await js("""
            if(gameView.uiLang!=='\(lang)')toggleLang();
            document.getElementById('homeSettings').classList.add('hidden');
            openFullSouqCard();true
            """)
            try await Task.sleep(for: .milliseconds(400))
            let report = try await js("""
            (function(){var ids=['moExpandBtn','moExpandRestore','moExpandLater','moExpandTerms','moExpandPrivacy'],out=[];
              ids.forEach(function(id){var r=document.getElementById(id).getBoundingClientRect();
                if(r.height<44||r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)out.push(id+':'+Math.round(r.height)+'@'+Math.round(r.top));});
              var price=document.getElementById('moExpandCost').querySelector('bdi');
              if(!price||price.dir!=='ltr'||!price.textContent.length)out.push('price');
              return out.join(',');})()
            """) as? String
            XCTAssertEqual(report, "", "\(lang): controls that miss 44pt or leave the screen")
            let shot = try await web.takeSnapshot(configuration: nil)
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("full-souq-card-\(lang).png")
            try shot.pngData()?.write(to: url)
            print("SNAPSHOT \(url.path)")
            _ = try await js("document.getElementById('moExpand').classList.add('hidden');true")
        }
    }

    func testTheSaveKeysAreCopiedOutOfThePage() async throws {
        _ = try await js("localStorage.setItem('souq_test_copy','kept');true")
        host.sync()
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline, host.vault.load()["souq_test_copy"] == nil {
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTAssertEqual(host.vault.load()["souq_test_copy"], "kept")
        _ = try await js("localStorage.removeItem('souq_test_copy');true")
    }
}
