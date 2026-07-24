import Foundation

/// 스캔된 한 페이지. 이미지 자체는 Documents/images 디렉터리에 JPEG 파일로 저장하고
/// 여기에는 파일명만 참조로 보관(인덱스 JSON을 가볍게 유지).
struct ScanPage: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var fileName: String
}

/// 여러 페이지를 묶는 문서 단위.
struct ScanDocument: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var title: String
    var pages: [ScanPage]
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
}
