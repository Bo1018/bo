import SwiftUI
import UIKit

/// 문서 상세 — 페이지 나열/순서변경/삭제, 이름 변경, PDF·이미지 내보내기.
struct DocumentDetailView: View {
    let docID: UUID

    @EnvironmentObject private var store: DocumentStore
    @Environment(\.dismiss) private var dismiss

    @State private var shareURLs: [URL] = []
    @State private var showShare = false
    @State private var isExporting = false
    @State private var renaming = false
    @State private var draftTitle = ""

    private enum ExportKind { case pdf, images }

    /// 저장소에서 항상 최신 문서를 파생(다른 화면의 편집도 반영).
    private var doc: ScanDocument? { store.documents.first { $0.id == docID } }

    var body: some View {
        Group {
            if let doc {
                content(doc)
            } else {
                // 문서가 삭제되면 자동으로 뒤로.
                Color.clear.onAppear { dismiss() }
            }
        }
    }

    private func content(_ doc: ScanDocument) -> some View {
        List {
            ForEach(doc.pages) { page in
                PageImageView(page: page, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Palette.border))
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Palette.bg)
            }
            .onMove { from, to in movePages(doc, from: from, to: to) }
            .onDelete { offsets in deletePages(doc, at: offsets) }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Palette.bg)
        .navigationTitle(doc.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) { EditButton() }
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        draftTitle = doc.title
                        renaming = true
                    } label: {
                        Label("이름 변경", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        store.delete(doc)
                        dismiss()
                    } label: {
                        Label("문서 삭제", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .safeAreaInset(edge: .bottom) { exportBar(doc) }
        .sheet(isPresented: $showShare) { ShareSheet(items: shareURLs) }
        .alert("이름 변경", isPresented: $renaming) {
            TextField("문서 이름", text: $draftTitle)
            Button("저장") {
                let trimmed = draftTitle.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return }
                var updated = doc
                updated.title = trimmed
                store.update(updated)
            }
            Button("취소", role: .cancel) {}
        }
    }

    private func exportBar(_ doc: ScanDocument) -> some View {
        HStack(spacing: 10) {
            Button { export(doc, as: .pdf) } label: {
                Label("PDF 공유", systemImage: "square.and.arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
            }
            .buttonStyle(.borderedProminent)
            .disabled(isExporting)

            Menu {
                Button("PDF로 저장·공유") { export(doc, as: .pdf) }
                Button("이미지로 저장·공유") { export(doc, as: .images) }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 50, height: 50)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Palette.border))
            }
            .disabled(isExporting)
        }
        .padding(12)
        .background(.bar)
    }

    // MARK: - 페이지 편집

    private func movePages(_ doc: ScanDocument, from: IndexSet, to: Int) {
        var updated = doc
        updated.pages.move(fromOffsets: from, toOffset: to)
        store.update(updated)
    }

    private func deletePages(_ doc: ScanDocument, at offsets: IndexSet) {
        let pages = offsets.map { doc.pages[$0] }
        store.removePages(pages, from: doc)
    }

    // MARK: - 내보내기

    private func export(_ doc: ScanDocument, as kind: ExportKind) {
        guard !isExporting else { return }
        isExporting = true

        let urls = doc.pages.map { store.imageURL(for: $0) }
        let title = Formatters.safeFileName(doc.title)

        Task {
            let output: [URL] = await Task.detached {
                let tmp = FileManager.default.temporaryDirectory
                switch kind {
                case .pdf:
                    let images = urls.compactMap { UIImage(contentsOfFile: $0.path) }
                    guard let data = PDFService.makePDF(from: images) else { return [] }
                    let out = tmp.appendingPathComponent("\(title).pdf")
                    try? data.write(to: out, options: .atomic)
                    return [out]
                case .images:
                    var result: [URL] = []
                    for (i, src) in urls.enumerated() {
                        let name = urls.count == 1 ? "\(title).jpg" : "\(title)_\(i + 1).jpg"
                        let out = tmp.appendingPathComponent(name)
                        try? FileManager.default.removeItem(at: out)
                        try? FileManager.default.copyItem(at: src, to: out)
                        result.append(out)
                    }
                    return result
                }
            }.value

            shareURLs = output
            isExporting = false
            showShare = !output.isEmpty
        }
    }
}
