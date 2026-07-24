import SwiftUI

@main
struct SimpleScanApp: App {
    @StateObject private var store = DocumentStore()

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environmentObject(store)
                .tint(Palette.accent)
        }
    }
}
