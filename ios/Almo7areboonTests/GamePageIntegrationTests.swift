import StoreKit
import StoreKitTest
import WebKit
import XCTest
import TasKit
@testable import Almo7areboon

/// The shipped game (dist/ → game/), in a real web view served from almo7areboon://, talking to the real host and
/// a local StoreKit session: it knows it is in the app, the battlefield loads offline, Full Journey is locked until
/// bought, its card fits a 390×844 screen in both languages, and the save is copied out.
@MainActor
final class GamePageIntegrationTests: XCTestCase {
    private var session: SKTestSession!
    private var dir: URL!
    private var host: TasGameHost!
    private var web: WKWebView!
    private var window: UIWindow!

    override func setUp() async throws {
        session = try SKTestSession(configurationFileNamed: "Almo7areboon")
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        for _ in 0..<120 {
            if let found = try? await Product.products(for: Catalog.productIDs), !found.isEmpty { break }
            try await Task.sleep(for: .milliseconds(250))
        }
        dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let defaults = UserDefaults(suiteName: "page-\(UUID().uuidString)")!
        host = TasGameHost(config: .almo7areboon, store: TasStore(config: .almo7areboon, defaults: defaults),
                           vault: TasSaveVault(config: .almo7areboon, directory: dir), gameCenter: nil)
        web = host.makeWebView()
        window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.addSubview(web)
        web.frame = window.bounds
        window.isHidden = false
        try await waitFor("typeof almoApp==='object'&&document.readyState==='complete'&&!!document.querySelector('[data-command=\"enter-world\"]')")
    }

    override func tearDown() async throws {
        // A page left running would write over the next test's save.
        web?.stopLoading()
        web?.removeFromSuperview()
        window?.isHidden = true
        web = nil
        try? FileManager.default.removeItem(at: dir)
    }

    private func js(_ source: String) async throws -> Any? {
        try await web.evaluateJavaScript(source)
    }

    private func waitFor(_ condition: String, seconds: Double = 25, file: StaticString = #filePath, line: UInt = #line) async throws {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            if (try? await js("Boolean(\(condition))")) as? Bool == true { return }
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTFail("timed out waiting for: \(condition)", file: file, line: line)
    }

    private func snapshot(_ name: String) async throws {
        let shot = try await web.takeSnapshot(configuration: nil)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(name).png")
        try shot.pngData()?.write(to: url)
        print("SNAPSHOT \(url.path)")
    }

    func testTheGameRunsInTheAppAndKnowsIt() async throws {
        let inApp = try await js("almoApp.inApp") as? Bool
        XCTAssertEqual(inApp, true)
        let proto = try await js("location.protocol") as? String
        XCTAssertEqual(proto, "almo7areboon:")
        let sw = try await js("navigator.serviceWorker ? navigator.serviceWorker.controller === null : true") as? Bool
        XCTAssertEqual(sw, true, "no service worker controls the app's page")
        let owns = try await js("almoApp.owns('fullGame')") as? Bool
        XCTAssertEqual(owns, false, "locked until bought")
        try await waitFor("(almoApp.prices.fullGame||'').length>0") // the App Store's own price reached the page
    }

    func testTheBattlefieldLoadsFromTheBundle() async throws {
        _ = try await js("window.__errors=[];addEventListener('error',function(e){__errors.push(String(e.message))});addEventListener('unhandledrejection',function(e){__errors.push(String(e.reason))});true")
        try await waitFor("document.getElementById('battlefield').dataset.renderer==='ready'", seconds: 30)
        let canvas = try await js("!!document.querySelector('#battlefield canvas')") as? Bool
        XCTAssertEqual(canvas, true)
        _ = try await js("document.querySelector('[data-command=\"enter-world\"]').click();true")
        try await Task.sleep(for: .seconds(12)) // the opening tale, then the first field
        let errors = try await js("__errors.join(' | ')") as? String
        XCTAssertEqual(errors, "", "the page threw while starting to play")
        try await snapshot("almo7areboon-first-field")
    }

    func testBuyingFullJourneyUnlocksIt() async throws {
        await host.store.buy("fullGame")
        XCTAssertTrue(host.store.owns("fullGame"))
        try await waitFor("almoApp.owns('fullGame')===true") // Swift told the page
    }

    /// The Full Journey card in both languages: every control a 44pt target, all of it on a 390×844 screen.
    func testTheFullJourneyCardFitsAndEveryControlIsATapTarget() async throws {
        try await waitFor("(almoApp.prices.fullGame||'').length>0")
        for lang in ["en", "ar"] {
            _ = try await js("window.__almoShowFullJourney&&window.__almoShowFullJourney();true")
            try await waitFor("!!document.querySelector('[data-command=\"buy-full-journey\"]')")
            try await Task.sleep(for: .milliseconds(400))
            let report = try await js("""
            (function(){var out=[];
              ['buy-full-journey','restore-purchases','open-terms','open-privacy','close'].forEach(function(c){
                var b=document.querySelector('#modal-layer [data-command="'+c+'"]');if(!b){out.push(c+':missing');return;}
                var r=b.getBoundingClientRect();
                if(r.height<44||r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)out.push(c+':'+Math.round(r.height)+'@'+Math.round(r.top));});
              var price=document.querySelector('[data-command="buy-full-journey"] bdi');
              if(!price||price.dir!=='ltr'||!price.textContent.length)out.push('price');
              return out.join(',');})()
            """) as? String
            XCTAssertEqual(report, "", "\(lang): controls that miss 44pt or leave the screen")
            try await snapshot("full-journey-card-\(lang)")
            if lang == "en" {
                // Switch language the way a player does, then come back to the card.
                _ = try await js("localStorage.setItem('almo7areboon.lang.v1','ar');location.reload();true")
                try await Task.sleep(for: .seconds(1))
                try await waitFor("typeof almoApp==='object'&&document.documentElement.lang==='ar'&&!!document.querySelector('[data-command=\"enter-world\"]')")
            }
        }
        _ = try await js("localStorage.removeItem('almo7areboon.lang.v1');true")
    }

    func testTheSaveKeysAreCopiedOutOfThePage() async throws {
        _ = try await js("localStorage.setItem('almo7areboon.test.copy','kept');true")
        host.sync()
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline, host.vault.load()["almo7areboon.test.copy"] == nil {
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTAssertEqual(host.vault.load()["almo7areboon.test.copy"], "kept")
        _ = try await js("localStorage.removeItem('almo7areboon.test.copy');true")
    }
}
