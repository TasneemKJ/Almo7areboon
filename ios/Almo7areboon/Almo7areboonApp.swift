//
//  Almo7areboonApp.swift
//  المحاربون · Almo7areboon for iPhone. The game is the Vite build in dist/, copied into the app
//  as the folder "game" and played offline in a web view by TasKit (folder mode); see ios/README.md.
//

import SwiftUI
import TasKit

@main
struct Almo7areboonApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var host = TasGameHost(config: .almo7areboon)

    var body: some Scene {
        WindowGroup {
            TasGameScreen(host: host)
        }
        .onChange(of: scenePhase) { phase in host.scenePhaseChanged(phase) }
    }
}
