import SwiftUI

/// 홈 그리드의 문서 카드 — 표지 썸네일, 페이지 수 배지, 제목/시간.
struct DocumentCardView: View {
    let doc: ScanDocument

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                Palette.surface2
                if let cover = doc.pages.first {
                    PageImageView(page: cover, contentMode: .fill)
                } else {
                    Image(systemName: "doc.text")
                        .font(.system(size: 28))
                        .foregroundStyle(Palette.muted)
                }
            }
            .aspectRatio(3.0 / 4.0, contentMode: .fill)
            .frame(maxWidth: .infinity)
            .clipped()
            .overlay(alignment: .topTrailing) {
                if doc.pages.count > 1 {
                    Text("\(doc.pages.count)장")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(.black.opacity(0.55), in: Capsule())
                        .padding(8)
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(doc.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Palette.ink)
                    .lineLimit(1)
                Text(Formatters.relative(doc.updatedAt))
                    .font(.caption)
                    .foregroundStyle(Palette.muted)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Palette.border))
    }
}
