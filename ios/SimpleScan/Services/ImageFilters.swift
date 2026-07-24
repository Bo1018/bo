import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

/// 스캔 결과에 적용할 문서 필터.
enum ScanFilter: String, CaseIterable, Identifiable {
    case original = "원본"
    case gray = "그레이"
    case bw = "흑백"

    var id: String { rawValue }
}

enum ImageFilters {
    private static let context = CIContext()

    /// 선택한 필터를 이미지에 적용해 새 UIImage 반환. 실패 시 원본 반환.
    static func apply(_ filter: ScanFilter, to image: UIImage) -> UIImage {
        guard filter != .original, let input = CIImage(image: image) else { return image }

        let output: CIImage
        switch filter {
        case .original:
            return image
        case .gray:
            let f = CIFilter.photoEffectMono()
            f.inputImage = input
            output = f.outputImage ?? input
        case .bw:
            // 채도 제거 + 대비/밝기 강화로 문서를 또렷하게.
            let f = CIFilter.colorControls()
            f.inputImage = input
            f.saturation = 0
            f.contrast = 1.4
            f.brightness = 0.05
            output = f.outputImage ?? input
        }

        guard let cg = context.createCGImage(output, from: output.extent) else { return image }
        return UIImage(cgImage: cg, scale: image.scale, orientation: image.imageOrientation)
    }
}
