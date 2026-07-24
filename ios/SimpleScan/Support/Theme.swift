import SwiftUI
import UIKit

/// 라이트/다크에 따라 자동 전환되는 색을 hex로 생성.
extension Color {
    init(lightHex: UInt, darkHex: UInt) {
        self.init(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(rgb: darkHex)
                : UIColor(rgb: lightHex)
        })
    }
}

extension UIColor {
    convenience init(rgb: UInt) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255,
            alpha: 1
        )
    }
}

/// "간편하고 눈이 편한" 디자인 토큰 — 순백/순검정 대비 대신 부드러운 톤,
/// 포인트 컬러는 세이지 그린 1종. 라이트/다크 모두 자동 대응.
enum Palette {
    static let bg = Color(lightHex: 0xF7F7F5, darkHex: 0x15171A)
    static let surface = Color(lightHex: 0xFFFFFF, darkHex: 0x1E2126)
    static let surface2 = Color(lightHex: 0xEFEFEC, darkHex: 0x262A30)
    static let ink = Color(lightHex: 0x1F2328, darkHex: 0xE7E7E5)
    static let muted = Color(lightHex: 0x5B6470, darkHex: 0x9AA3AE)
    static let border = Color(lightHex: 0xE4E4DF, darkHex: 0x2C3138)
    static let accent = Color(lightHex: 0x4C8C6B, darkHex: 0x5AA37E)
    static let accentSoft = Color(lightHex: 0xE6F0EA, darkHex: 0x22302A)
    static let accentFg = Color(lightHex: 0xFFFFFF, darkHex: 0x10221A)
    static let danger = Color(lightHex: 0xC4453D, darkHex: 0xE06A62)
}
