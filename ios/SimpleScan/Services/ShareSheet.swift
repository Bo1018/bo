import SwiftUI
import UIKit

/// UIActivityViewController 래퍼. 파일 URL을 전달하면 "저장(파일 앱)"·공유 모두 처리된다.
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
