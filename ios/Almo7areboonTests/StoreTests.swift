import StoreKit
import StoreKitTest
import XCTest
import TasKit
@testable import SouqAlLayl

/// The catalog against the local StoreKit configuration (SouqAlLayl.storekit).
@MainActor
final class SouqStoreTests: XCTestCase {
    private var session: SKTestSession!
    private var defaults: UserDefaults!

    override func setUp() async throws {
        session = try SKTestSession(configurationFileNamed: "SouqAlLayl")
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        defaults = UserDefaults(suiteName: "store-\(UUID().uuidString)")!
        // A cold simulator's StoreKit daemon takes a few seconds to load the test configuration.
        for _ in 0..<120 {
            if let found = try? await Product.products(for: Catalog.productIDs), !found.isEmpty { return }
            try await Task.sleep(for: .milliseconds(250))
        }
        XCTFail("the local StoreKit configuration never offered Full Souq")
    }

    func testThePriceComesFromTheStore() async {
        let store = TasStore(config: .souq, defaults: defaults)
        let found = await store.loadProducts()
        XCTAssertTrue(found)
        XCTAssertFalse((store.prices["fullSouq"] ?? "").isEmpty)
        XCTAssertEqual(TasStore(config: .souq, defaults: defaults).prices, store.prices, "cached for the next launch")
    }

    func testBuyingOpensItAndTheAnswerIsCached() async {
        let store = TasStore(config: .souq, defaults: defaults)
        var heard = 0
        store.onChange = { heard += 1 }
        await store.refreshEntitlements()
        XCTAssertFalse(store.owns("fullSouq"))
        await store.buy("fullSouq")
        XCTAssertTrue(store.owns("fullSouq"))
        XCTAssertEqual(store.status, .none)
        XCTAssertGreaterThan(heard, 0, "the page is told")
        XCTAssertTrue(TasStore(config: .souq, defaults: defaults).owns("fullSouq"), "the next launch starts unlocked")
    }

    func testARefundLocksItAgain() async throws {
        let store = TasStore(config: .souq, defaults: defaults)
        await store.buy("fullSouq")
        XCTAssertTrue(store.owns("fullSouq"))
        let transaction = try XCTUnwrap(session.allTransactions().first)
        try session.refundTransaction(identifier: UInt(transaction.identifier))
        // SKTestSession applies a refund asynchronously (as Quranian's tests found): re-check for up to 5 s.
        for _ in 0..<50 where store.owns("fullSouq") {
            await store.refreshEntitlements()
            if store.owns("fullSouq") { try await Task.sleep(for: .milliseconds(100)) }
        }
        XCTAssertFalse(store.owns("fullSouq"))
    }

    func testAskToBuyWaitsForApproval() async {
        session.askToBuyEnabled = true
        let store = TasStore(config: .souq, defaults: defaults)
        await store.buy("fullSouq")
        XCTAssertFalse(store.owns("fullSouq"))
        XCTAssertEqual(store.status, .pending)
        store.clearStalePending() // the parent declined; the card opens again
        XCTAssertEqual(store.status, .none)
    }

    func testAFailedPurchaseSaysSo() async throws {
        try await session.setSimulatedError(.generic(.unknown), forAPI: .purchase)
        let store = TasStore(config: .souq, defaults: defaults)
        await store.buy("fullSouq")
        XCTAssertFalse(store.owns("fullSouq"))
        XCTAssertEqual(store.status, .failed)
    }

    func testSomethingNotInTheCatalogIsNeverSold() async {
        let store = TasStore(config: .souq, defaults: defaults)
        await store.buy("coins")
        XCTAssertEqual(store.status, .unavailable)
        XCTAssertEqual(store.owned, [])
    }

    func testTheCatalogIsWellFormed() {
        XCTAssertEqual(Set(Catalog.all.map(\.key)).count, Catalog.all.count, "keys are unique")
        XCTAssertEqual(Set(Catalog.productIDs).count, Catalog.all.count, "product IDs are unique")
        XCTAssertTrue(Catalog.productIDs.allSatisfy { $0.hasPrefix("Tas.SouqAlLayl.") })
        XCTAssertEqual(TasStore(config: .souq, defaults: defaults).ownedMap, ["fullSouq": false], "the page hears every key")
    }
}
