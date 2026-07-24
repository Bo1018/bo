import SwiftUI
import UIKit
import PhotosUI
import UniformTypeIdentifiers

/// 홈(문서함) — 문서 그리드, 스캔/가져오기 진입점.
struct LibraryView: View {
    @EnvironmentObject private var store: DocumentStore

    @State private var showSourceDialog = false
    @State private var showScanner = false
    @State private var showFileImporter = false
    @State private var photoSelection: [PhotosPickerItem] = []
    @State private var showPhotoPicker = false

    @State private var pendingImages: [UIImage] = []
    @State private var showReview = false
    @State private var scannerUnavailable = false

    private let columns = [GridItem(.adaptive(minimum: 150), spacing: 12)]

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Palette.bg.ignoresSafeArea()

                if store.documents.isEmpty {
                    EmptyStateView { showSourceDialog = true }
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(store.documents) { doc in
                                NavigationLink(value: doc.id) {
                                    DocumentCardView(doc: doc)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(16)
                        .padding(.bottom, 96)
                    }
                }

                scanButton
            }
            .navigationTitle("심플스캔")
            .navigationDestination(for: UUID.self) { id in
                DocumentDetailView(docID: id)
            }
            .fullScreenCover(isPresented: $showScanner) {
                DocumentScanner(
                    onComplete: { images in
                        showScanner = false
                        present(images)
                    },
                    onCancel: { showScanner = false }
                )
                .ignoresSafeArea()
            }
            .photosPicker(isPresented: $showPhotoPicker, selection: $photoSelection, matching: .images)
            .onChange(of: photoSelection) { items in
                guard !items.isEmpty else { return }
                Task { await loadPhotos(items) }
            }
            .fileImporter(
                isPresented: $showFileImporter,
                allowedContentTypes: [.pdf],
                allowsMultipleSelection: true
            ) { result in
                handleFileImport(result)
            }
            .sheet(isPresented: $showReview) {
                ScanReviewView(images: pendingImages) { title, processed in
                    store.createDocument(title: title, images: processed)
                    pendingImages = []
                }
            }
            .confirmationDialog("새 문서", isPresented: $showSourceDialog, titleVisibility: .visible) {
                Button("카메라로 스캔") { startScan() }
                Button("사진에서 가져오기") { showPhotoPicker = true }
                Button("PDF 가져오기") { showFileImporter = true }
                Button("취소", role: .cancel) {}
            }
            .alert("이 기기는 문서 스캔을 지원하지 않아요", isPresented: $scannerUnavailable) {
                Button("확인", role: .cancel) {}
            } message: {
                Text("사진이나 PDF 가져오기를 이용해 주세요.")
            }
        }
    }

    private var scanButton: some View {
        Button { showSourceDialog = true } label: {
            Label("스캔하기", systemImage: "doc.viewfinder")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Palette.accentFg)
                .padding(.horizontal, 22)
                .frame(height: 54)
                .background(Palette.accent, in: Capsule())
                .shadow(color: .black.opacity(0.18), radius: 14, y: 6)
        }
        .padding(.bottom, 24)
    }

    // MARK: - 소스 처리

    private func startScan() {
        if DocumentScanner.isSupported {
            showScanner = true
        } else {
            scannerUnavailable = true
        }
    }

    private func present(_ images: [UIImage]) {
        guard !images.isEmpty else { return }
        pendingImages = images
        showReview = true
    }

    private func loadPhotos(_ items: [PhotosPickerItem]) async {
        var images: [UIImage] = []
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                images.append(image)
            }
        }
        photoSelection = []
        present(images)
    }

    private func handleFileImport(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result, !urls.isEmpty else { return }
        Task {
            let images: [UIImage] = await Task.detached {
                var collected: [UIImage] = []
                for url in urls {
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    collected.append(contentsOf: PDFService.images(fromPDF: url))
                }
                return collected
            }.value
            present(images)
        }
    }
}
