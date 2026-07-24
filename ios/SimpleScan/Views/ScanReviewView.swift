import SwiftUI
import UIKit

/// 스캔/가져오기 직후 검토 화면 — 제목 지정, 필터 선택, 저장.
struct ScanReviewView: View {
    let images: [UIImage]
    var onSave: (_ title: String, _ processed: [UIImage]) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title: String
    @State private var filter: ScanFilter = .original
    @State private var isSaving = false

    init(images: [UIImage], onSave: @escaping (String, [UIImage]) -> Void) {
        self.images = images
        self.onSave = onSave
        _title = State(initialValue: Formatters.defaultDocTitle())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let first = images.first {
                        Image(uiImage: ImageFilters.apply(filter, to: first))
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 360)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Palette.border))
                    }

                    Picker("필터", selection: $filter) {
                        ForEach(ScanFilter.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    Text("\(images.count)장의 페이지")
                        .font(.footnote)
                        .foregroundStyle(Palette.muted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(16)
            }
            .background(Palette.bg)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("검토")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 10) {
                    TextField("문서 이름", text: $title)
                        .textFieldStyle(.roundedBorder)
                    Button(action: save) {
                        Text(isSaving ? "저장 중…" : "저장")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isSaving)
                }
                .padding(16)
                .background(.bar)
            }
        }
        .tint(Palette.accent)
    }

    private func save() {
        guard !isSaving else { return }
        isSaving = true
        // 이미지가 많지 않으므로 검토 단계에서 필터를 적용해 저장.
        let processed = images.map { ImageFilters.apply(filter, to: $0) }
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        onSave(trimmed.isEmpty ? Formatters.defaultDocTitle() : trimmed, processed)
        dismiss()
    }
}
