import PDFKit
import UIKit

enum PDFService {
    /// 여러 이미지를 하나의 PDF Data로 병합. 각 페이지 크기는 이미지에 맞춘다.
    static func makePDF(from images: [UIImage]) -> Data? {
        let pdf = PDFDocument()
        var index = 0
        for image in images {
            guard let page = PDFPage(image: image) else { continue }
            pdf.insert(page, at: index)
            index += 1
        }
        guard pdf.pageCount > 0 else { return nil }
        return pdf.dataRepresentation()
    }

    /// PDF 파일의 각 페이지를 이미지로 렌더링해 가져오기.
    static func images(fromPDF url: URL, scale: CGFloat = 2) -> [UIImage] {
        guard let doc = PDFDocument(url: url) else { return [] }
        var result: [UIImage] = []
        for i in 0..<doc.pageCount {
            guard let page = doc.page(at: i) else { continue }
            let bounds = page.bounds(for: .mediaBox)
            let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
            guard size.width > 0, size.height > 0 else { continue }

            let renderer = UIGraphicsImageRenderer(size: size)
            let image = renderer.image { ctx in
                UIColor.white.set()
                ctx.fill(CGRect(origin: .zero, size: size))
                // PDF 좌표계(원점 좌하단)를 UIKit(좌상단)로 뒤집는다.
                ctx.cgContext.translateBy(x: 0, y: size.height)
                ctx.cgContext.scaleBy(x: scale, y: -scale)
                page.draw(with: .mediaBox, to: ctx.cgContext)
            }
            result.append(image)
        }
        return result
    }
}
