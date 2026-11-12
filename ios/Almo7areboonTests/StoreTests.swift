import StoreKit
import StoreKitTest
import XCTest
import TasKit
@testable import Almo7areboon

/// The catalog against the local StoreKit configuration (Almo7areboon.storekit).
@MainActor
final class StoreTests: XCTestCase {
    private var session: SKTestSession!
    private var defaults: UserDefaults!

    override func setUp() async throws {
        session = try SKTestSession(configurationFileNamed: "Almo7areboon")
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        defaults = UserDefaults(suiteName: "store-\(UUID().uuidString)")!
        // A cold simulator's StoreKit daemon takes a few seconds to load the test configuration.
        for _ in 0..<240 {
            if let found = try? await Product.products(for: Catalog.productIDs), found.count == Catalog.all.count { return }
            try await Task.sleep(for: .milliseconds(250))
        }
        XCTFail("the local StoreKit configuration never offered the catalog")
    }

    func testThePriceComesFromTheStore() async {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        let found = await store.loadProducts()
        XCTAssertTrue(found)
        XCTAssertFalse((store.prices["fullGame"] ?? "").isEmpty)
        XCTAssertEqual(TasStore(config: .almo7areboon, defaults: defaults).prices, store.prices, "cached for the next launch")
    }

    func testBuyingOpensItAndTheAnswerIsCached() async {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        var heard = 0
        store.onChange = { heard += 1 }
        await store.refreshEntitlements()
        XCTAssertFalse(store.owns("fullGame"))
        await store.buy("fullGame")
        XCTAssertTrue(store.owns("fullGame"))
        XCTAssertEqual(store.status, .none)
        XCTAssertGreaterThan(heard, 0, "the page is told")
        XCTAssertTrue(TasStore(config: .almo7areboon, defaults: defaults).owns("fullGame"), "the next launch starts unlocked")
    }

    func testARefundLocksItAgain() async throws {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("fullGame")
        XCTAssertTrue(store.owns("fullGame"))
        let transaction = try XCTUnwrap(session.allTransactions().first)
        try session.refundTransaction(identifier: UInt(transaction.identifier))
        // SKTestSession applies a refund asynchronously (as Quranian's tests found): re-check for up to 5 s.
        for _ in 0..<50 where store.owns("fullGame") {
            await store.refreshEntitlements()
            if store.owns("fullGame") { try await Task.sleep(for: .milliseconds(100)) }
        }
        XCTAssertFalse(store.owns("fullGame"))
    }

    func testAskToBuyWaitsForApproval() async {
        session.askToBuyEnabled = true
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("fullGame")
        XCTAssertFalse(store.owns("fullGame"))
        XCTAssertEqual(store.status, .pending)
        store.clearStalePending() // the parent declined; the card opens again
        XCTAssertEqual(store.status, .none)
    }

    func testAFailedPurchaseSaysSo() async throws {
        try await session.setSimulatedError(.generic(.unknown), forAPI: .purchase)
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("fullGame")
        XCTAssertFalse(store.owns("fullGame"))
        XCTAssertEqual(store.status, .failed)
    }

    func testSomethingNotInTheCatalogIsNeverSold() async {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("coins")
        XCTAssertEqual(store.status, .unavailable)
        XCTAssertEqual(store.owned, [])
    }

    func testTheCatalogIsWellFormed() {
        XCTAssertEqual(Set(Catalog.all.map(\.key)).count, Catalog.all.count, "keys are unique")
        XCTAssertEqual(Set(Catalog.productIDs).count, Catalog.all.count, "product IDs are unique")
        XCTAssertTrue(Catalog.productIDs.allSatisfy { $0.hasPrefix("Tas.Almo7areboon.") })
        XCTAssertEqual(TasStore(config: .almo7areboon, defaults: defaults).ownedMap, ["fullGame": false, "lamplighterMonthly": false, "lamplighterYearly": false], "the page hears every key")
    }

    // MARK: The Lamplighter (a companion on the field): auto-renewing, one group, two lengths

    /// SKTestSession applies expiry, refunds and upgrades asynchronously: re-read for up to 5 s.
    private func settle(_ store: TasStore, until done: () -> Bool) async throws {
        for _ in 0..<50 {
            await store.refreshEntitlements()
            if done() { return }
            try await Task.sleep(for: .milliseconds(100))
        }
    }

    func testBothPlansArePricedByTheStore() async {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.loadProducts()
        XCTAssertFalse((store.prices["lamplighterMonthly"] ?? "").isEmpty)
        XCTAssertFalse((store.prices["lamplighterYearly"] ?? "").isEmpty)
        XCTAssertNotEqual(store.prices["lamplighterMonthly"], store.prices["lamplighterYearly"])
    }

    func testBothPlansAreOneGroupWithTheirOwnPeriods() async throws {
        let products = try await Product.products(for: [Catalog.lamplighterMonthly.productID, Catalog.lamplighterYearly.productID])
        let monthly = try XCTUnwrap(products.first { $0.id == Catalog.lamplighterMonthly.productID }?.subscription)
        let yearly = try XCTUnwrap(products.first { $0.id == Catalog.lamplighterYearly.productID }?.subscription)
        XCTAssertEqual(monthly.subscriptionGroupID, yearly.subscriptionGroupID)
        XCTAssertEqual(monthly.subscriptionPeriod.unit, .month)
        XCTAssertEqual(monthly.subscriptionPeriod.value, 1)
        XCTAssertEqual(yearly.subscriptionPeriod.unit, .year)
        XCTAssertEqual(yearly.subscriptionPeriod.value, 1)
        XCTAssertLessThan(yearly.groupLevel, monthly.groupLevel, "yearly ranks above monthly: moving to it is an upgrade")
    }

    func testSubscribingBringsTheLamplighterAndNothingElse() async {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("lamplighterMonthly")
        XCTAssertEqual(store.owned, ["lamplighterMonthly"])
        XCTAssertFalse(store.owns("fullGame"), "the subscription opens no chapter")
        XCTAssertEqual(store.status, .none)
        XCTAssertTrue(TasStore(config: .almo7areboon, defaults: defaults).owns("lamplighterMonthly"), "the next launch starts with the answer")
    }

    func testAStaleStatusDoesNotHideAFreshPurchase() {
        let now = Date(), old = now.addingTimeInterval(-3600), fresh = now.addingTimeInterval(-5)
        XCTAssertTrue(TasStore.entitles(state: .expired, statusDescribes: (1, old), transaction: (2, fresh),
                                        expiry: now.addingTimeInterval(2_592_000), now: now))
        XCTAssertFalse(TasStore.entitles(state: .expired, statusDescribes: (2, fresh), transaction: (2, fresh),
                                         expiry: now.addingTimeInterval(2_592_000), now: now))
        XCTAssertFalse(TasStore.entitles(state: .expired, statusDescribes: (1, old), transaction: (2, fresh),
                                         expiry: now.addingTimeInterval(-1), now: now))
        XCTAssertTrue(TasStore.entitles(state: .inGracePeriod, statusDescribes: nil, transaction: (2, fresh), expiry: nil, now: now))
    }

    func testAnExpiredSubscriptionEndsAndANewOneReturns() async throws {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("lamplighterMonthly")
        XCTAssertTrue(store.owns("lamplighterMonthly"))
        // Cancelled, then the paid period runs out (left renewing, the test session renews it at once).
        let transaction = try XCTUnwrap(session.allTransactions().last(where: { $0.productIdentifier == Catalog.lamplighterMonthly.productID }))
        try session.disableAutoRenewForTransaction(identifier: UInt(transaction.identifier))
        try session.expireSubscription(productIdentifier: Catalog.lamplighterMonthly.productID)
        try await settle(store) { !store.owns("lamplighterMonthly") }
        XCTAssertEqual(store.owned, [])
        XCTAssertFalse(TasStore(config: .almo7areboon, defaults: defaults).owns("lamplighterMonthly"), "the cached answer follows")
        await store.buy("lamplighterMonthly")
        try await settle(store) { store.owns("lamplighterMonthly") }
        XCTAssertTrue(store.owns("lamplighterMonthly"), "resubscribed")
    }

    func testARefundedSubscriptionEnds() async throws {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("lamplighterYearly")
        XCTAssertTrue(store.owns("lamplighterYearly"))
        let transaction = try XCTUnwrap(session.allTransactions().last(where: { $0.productIdentifier == Catalog.lamplighterYearly.productID }))
        try session.refundTransaction(identifier: UInt(transaction.identifier))
        try await settle(store) { !store.owns("lamplighterYearly") }
        XCTAssertEqual(store.owned, [])
    }

    func testMonthlyUpgradesToYearlyInsideTheGroup() async throws {
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("lamplighterMonthly")
        XCTAssertEqual(store.owned, ["lamplighterMonthly"])
        await store.buy("lamplighterYearly")
        try await settle(store) { store.owned == ["lamplighterYearly"] }
        XCTAssertEqual(store.owned, ["lamplighterYearly"], "one live plan: the upgraded monthly no longer counts")
    }

    func testAskToBuyWaitsForTheSubscriptionToo() async {
        session.askToBuyEnabled = true
        let store = TasStore(config: .almo7areboon, defaults: defaults)
        await store.buy("lamplighterMonthly")
        XCTAssertEqual(store.owned, [])
        XCTAssertEqual(store.status, .pending)
    }

    func testGraceCountsAsLiveAndBillingRetryDoesNot() {
        XCTAssertTrue(TasStore.entitles(.subscribed))
        XCTAssertTrue(TasStore.entitles(.inGracePeriod))
        XCTAssertFalse(TasStore.entitles(.inBillingRetryPeriod))
        XCTAssertFalse(TasStore.entitles(.expired))
        XCTAssertFalse(TasStore.entitles(.revoked))
        let now = Date()
        XCTAssertTrue(TasStore.entitles(expiry: now.addingTimeInterval(60), now: now))
        XCTAssertFalse(TasStore.entitles(expiry: now.addingTimeInterval(-60), now: now))
        XCTAssertTrue(TasStore.entitles(expiry: nil, now: now))
    }

    func testOnlyACatalogWithASubscriptionMayAskForTheManageSheet() {
        XCTAssertEqual(TasBridgeMessage.parse(["type": "manageSubscriptions"], config: .almo7areboon), .manageSubscriptions)
        var noSubs = TasGameConfig.almo7areboon
        noSubs.catalog = [Catalog.fullGame]
        XCTAssertNil(TasBridgeMessage.parse(["type": "manageSubscriptions"], config: noSubs))
    }
}

