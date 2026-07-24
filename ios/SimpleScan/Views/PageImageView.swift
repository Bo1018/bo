import SwiftUI
import UIKit

/// 디스크에 저장된 페이지 이미지를 비동기로 로드해 표시.
struct PageImageView: View {
    @EnvironmentObject private var store: DocumentStore
    let page: ScanPage
    var contentMode: ContentMode = .fit

    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                Palette.surface2
            }
        }
        .task(id: page.id) {
            image = await ImageLoader.load(store.imageURL(for: page))
        }
    }
}
