import SwiftUI

/// 문서가 없을 때의 빈 상태.
struct EmptyStateView: View {
    var action: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "doc.viewfinder")
                .font(.system(size: 38))
                .foregroundStyle(Palette.accent)
                .frame(width: 84, height: 84)
                .background(Palette.accentSoft, in: RoundedRectangle(cornerRadius: 24, style: .continuous))

            Text("아직 문서가 없어요")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Palette.ink)

            Text("아래 스캔하기 버튼으로 문서를 촬영하거나\n이미지·PDF를 가져와 시작하세요.")
                .font(.subheadline)
                .foregroundStyle(Palette.muted)
                .multilineTextAlignment(.center)

            Button(action: action) {
                Label("첫 문서 만들기", systemImage: "plus")
                    .font(.system(size: 15, weight: .medium))
                    .padding(.horizontal, 18)
                    .frame(height: 46)
                    .background(Palette.surface, in: Capsule())
                    .overlay(Capsule().stroke(Palette.border))
                    .foregroundStyle(Palette.ink)
            }
            .padding(.top, 4)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
