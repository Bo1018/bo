import SwiftUI
import UIKit

/// 파일 기반 로컬 저장소. 인덱스는 Documents/documents.json,
/// 페이지 이미지는 Documents/images/<uuid>.jpg 로 보관한다.
@MainActor
final class DocumentStore: ObservableObject {
    @Published private(set) var documents: [ScanDocument] = []

    private let fm = FileManager.default
    private let indexURL: URL
    /// 뷰/내보내기에서 격리 밖(백그라운드)에서도 경로를 계산할 수 있도록 nonisolated.
    nonisolated let imagesDir: URL

    init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        indexURL = docs.appendingPathComponent("documents.json")
        imagesDir = docs.appendingPathComponent("images", isDirectory: true)
        try? FileManager.default.createDirectory(at: imagesDir, withIntermediateDirectories: true)
        load()
    }

    // MARK: - 로드/저장

    func load() {
        guard let data = try? Data(contentsOf: indexURL) else {
            documents = []
            return
        }
        let decoded = (try? JSONDecoder().decode([ScanDocument].self, from: data)) ?? []
        documents = decoded.sorted { $0.updatedAt > $1.updatedAt }
    }

    private func persist() {
        documents.sort { $0.updatedAt > $1.updatedAt }
        if let data = try? JSONEncoder().encode(documents) {
            try? data.write(to: indexURL, options: .atomic)
        }
    }

    // MARK: - 문서 CRUD

    @discardableResult
    func createDocument(title: String, images: [UIImage]) -> ScanDocument {
        var pages: [ScanPage] = []
        for image in images {
            guard let data = image.jpegData(compressionQuality: 0.9) else { continue }
            let name = "\(UUID().uuidString).jpg"
            try? data.write(to: imagesDir.appendingPathComponent(name), options: .atomic)
            pages.append(ScanPage(fileName: name))
        }
        var doc = ScanDocument(title: title, pages: pages)
        doc.updatedAt = Date()
        documents.insert(doc, at: 0)
        persist()
        return doc
    }

    func update(_ doc: ScanDocument) {
        guard let idx = documents.firstIndex(where: { $0.id == doc.id }) else { return }
        var updated = doc
        updated.updatedAt = Date()
        documents[idx] = updated
        persist()
    }

    func delete(_ doc: ScanDocument) {
        for page in doc.pages { deleteFile(page.fileName) }
        documents.removeAll { $0.id == doc.id }
        persist()
    }

    func removePages(_ pages: [ScanPage], from doc: ScanDocument) {
        guard var current = documents.first(where: { $0.id == doc.id }) else { return }
        let ids = Set(pages.map(\.id))
        current.pages.removeAll { ids.contains($0.id) }
        for page in pages { deleteFile(page.fileName) }
        if current.pages.isEmpty {
            documents.removeAll { $0.id == current.id }
            persist()
        } else {
            update(current)
        }
    }

    // MARK: - 이미지 접근

    nonisolated func imageURL(for page: ScanPage) -> URL {
        imagesDir.appendingPathComponent(page.fileName)
    }

    private func deleteFile(_ name: String) {
        let url = imagesDir.appendingPathComponent(name)
        ImageLoader.invalidate(url)
        try? fm.removeItem(at: url)
    }
}
