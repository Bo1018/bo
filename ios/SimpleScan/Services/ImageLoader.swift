import UIKit

/// 디스크 이미지의 비동기 로더 + 스레드 안전 캐시(NSCache).
/// 메인 스레드 디코딩 잼을 피하기 위해 백그라운드에서 로드한다.
enum ImageLoader {
    private static let cache = NSCache<NSString, UIImage>()

    static func load(_ url: URL) async -> UIImage? {
        let key = url.path as NSString
        if let cached = cache.object(forKey: key) { return cached }

        return await Task.detached(priority: .userInitiated) {
            guard let image = UIImage(contentsOfFile: url.path) else { return nil }
            cache.setObject(image, forKey: key)
            return image
        }.value
    }

    static func invalidate(_ url: URL) {
        cache.removeObject(forKey: url.path as NSString)
    }
}
