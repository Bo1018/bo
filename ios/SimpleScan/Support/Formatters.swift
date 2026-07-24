import Foundation

enum Formatters {
    /// "스캔 7월 24일 오후 3:12" 형태의 기본 문서명.
    static func defaultDocTitle(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M월 d일 a h:mm"
        return "스캔 " + f.string(from: date)
    }

    /// "3시간 전" 등 상대 시간.
    static func relative(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }

    /// 파일명에 안전하지 않은 문자를 정리.
    static func safeFileName(_ title: String) -> String {
        let invalid = CharacterSet(charactersIn: "/\\:*?\"<>|")
        let cleaned = title.components(separatedBy: invalid).joined(separator: "_")
        let trimmed = cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "문서" : trimmed
    }
}
