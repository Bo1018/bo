# 심플스캔 — iOS 네이티브 앱 (SwiftUI)

VisionKit 문서 스캐너 + PDFKit 기반의 네이티브 iOS 문서 스캐너입니다.
카메라로 문서를 스캔(엣지 감지·원근 보정·향상은 OS가 처리)하거나 사진·PDF를
가져와 필터를 적용하고, 여러 페이지를 하나의 PDF로 내보내거나 이미지로 공유합니다.

> 기획/디자인 원칙은 상위 폴더 [`../docs/PLANNING.md`](../docs/PLANNING.md) 참고.
> (같은 리포의 `app/` 웹 프로토타입과는 별개인 순수 네이티브 구현입니다.)

## 요구 사항

- **macOS + Xcode 15 이상** (iOS 앱 빌드는 Mac에서만 가능)
- iOS 16.0+ 타깃
- 실기기 스캔 테스트 권장 (VisionKit 문서 스캐너는 시뮬레이터에서 카메라 미지원)

## 프로젝트 열기

이 프로젝트는 [XcodeGen](https://github.com/yonyz/XcodeGen)으로 `.xcodeproj`를
생성합니다(생성물은 git에 커밋하지 않음).

```bash
brew install xcodegen        # 최초 1회
cd ios
xcodegen generate           # SimpleScan.xcodeproj 생성
open SimpleScan.xcodeproj
```

Xcode에서 `Signing & Capabilities`의 Team을 본인 계정으로 설정한 뒤
실기기를 선택해 실행하세요.

### XcodeGen 없이 여는 방법(대안)

1. Xcode에서 새 **iOS App**(SwiftUI, 이름 SimpleScan) 프로젝트 생성
2. `SimpleScan/` 하위의 모든 `.swift` 파일과 `Assets.xcassets`를 드래그해 추가
3. Target > Info에 `NSCameraUsageDescription` 키 추가(카메라 사용 설명)
4. Deployment Target을 iOS 16.0으로 설정

## 구조

```
SimpleScan/
  SimpleScanApp.swift          @main 진입점
  Support/
    Theme.swift                디자인 토큰(소프트 팔레트, 자동 다크모드)
    Formatters.swift           날짜/상대시간 포맷
  Models/
    ScanModels.swift           ScanDocument / ScanPage (Codable)
  Stores/
    DocumentStore.swift        파일 기반 로컬 저장소(ObservableObject)
  Services/
    DocumentScanner.swift      VisionKit VNDocumentCameraViewController 래퍼
    PDFService.swift           PDFKit: 이미지→PDF, PDF→이미지
    ImageFilters.swift         CoreImage 필터(원본/그레이/흑백)
    ImageLoader.swift          디스크 이미지 비동기 로더 + 캐시
    ShareSheet.swift           UIActivityViewController 래퍼
  Views/
    LibraryView.swift          홈(문서함) + 소스 선택
    DocumentCardView.swift     문서 카드
    ScanReviewView.swift       스캔 검토(제목·필터·저장)
    DocumentDetailView.swift   페이지 순서변경·삭제·이름변경·내보내기
    PageImageView.swift        디스크 이미지 뷰
    Components.swift           공용 UI(빈 상태 등)
  Assets.xcassets/             AccentColor(세이지 그린), AppIcon(자리표시자)
```

## 핵심 기술

| 기능 | 프레임워크 |
|---|---|
| 문서 스캔(엣지 감지·원근 보정·향상) | **VisionKit** `VNDocumentCameraViewController` |
| PDF 생성/렌더링 | **PDFKit** |
| 사진 가져오기 | **PhotosUI** `PhotosPicker` |
| PDF 가져오기 | `fileImporter` + PDFKit |
| 필터 | **CoreImage** |
| 공유/내보내기 | `UIActivityViewController`(파일로 저장·공유) |
| 로컬 저장 | Documents 디렉터리 + JSON 인덱스 |

## 남은 작업(다음 단계 후보)

- App Icon 1024pt 이미지 추가(`Assets.xcassets/AppIcon.appiconset`)
- OCR(VisionKit `RecognizeText`), 폴더/태그 정리
- iCloud 동기화(선택), 유닛/UI 테스트 타깃
