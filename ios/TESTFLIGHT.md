# TestFlight 업로드 가이드 — 심플스캔

TestFlight(베타 배포)에 올리는 전체 절차입니다. **모든 단계는 macOS + Xcode에서 진행**합니다.

## 0. 사전 조건(가장 중요)

| 항목 | 필요 여부 | 비고 |
|---|---|---|
| **Apple Developer Program 가입** | ✅ 필수 | 유료(연 US$99). 무료 계정은 실기기 설치만 되고 **TestFlight 불가**. |
| macOS + Xcode 15+ | ✅ 필수 | 아카이브·업로드는 Mac에서만 |
| App Store Connect 앱 등록 | ✅ 필수 | 아래 2단계 |
| 고유한 Bundle ID | ✅ 필수 | 현재 `com.simplescan.app` → **본인 팀 도메인으로 변경 권장**(예: `com.<yourteam>.simplescan`) |
| 1024×1024 앱 아이콘 | ✅ 준비됨 | `Assets.xcassets/AppIcon.appiconset/icon-1024.png` (디자이너 교체 가능) |
| 수출 규정(암호화) 응답 | ✅ 자동 처리됨 | `ITSAppUsesNonExemptEncryption=false` 설정해 둠 |

## 1. Bundle ID를 고유하게 변경

`project.yml`의 `PRODUCT_BUNDLE_IDENTIFIER`를 팀 고유값으로 바꾸세요(App Store Connect에서
이미 등록되지 않은 값이어야 함). 변경 후:

```bash
cd ios && xcodegen generate
```

## 2. App Store Connect에 앱 만들기

1. https://appstoreconnect.apple.com → **나의 앱** → **＋ → 신규 앱**
2. 플랫폼 iOS, 이름(예: 심플스캔), 기본 언어 한국어, **Bundle ID**(1단계 값), SKU 임의 입력
3. 생성

> Bundle ID가 목록에 없으면 https://developer.apple.com/account → Identifiers 에서 먼저 등록.

## 3. Xcode에서 서명 설정

```bash
cd ios && xcodegen generate && open SimpleScan.xcodeproj
```

- 타깃 **SimpleScan → Signing & Capabilities**
- **Automatically manage signing** 체크
- **Team**을 본인 Apple Developer 팀으로 선택 (프로비저닝은 Xcode가 자동 생성)

## 4. 아카이브 & 업로드 (Xcode GUI — 권장)

1. 상단 실행 대상에서 **Any iOS Device (arm64)** 선택 (시뮬레이터 아님)
2. 메뉴 **Product → Archive**
3. 완료되면 **Organizer**가 열림 → 방금 아카이브 선택 → **Distribute App**
4. **App Store Connect → Upload → (자동 서명) → Upload**
5. 업로드 후 App Store Connect의 **TestFlight** 탭에서 빌드가 "처리 중"으로 표시(수 분~수십 분)

## 5. 테스터 배포

- **내부 테스트(App Store Connect 사용자, 심사 없이 즉시)**: TestFlight → 내부 그룹에 빌드 추가 → 테스터(본인 Apple ID) 초대
- **외부 테스트(최대 10,000명, 최초 빌드는 간단한 베타 심사)**: 외부 그룹 생성 → 빌드 추가 → 심사 제출 → 승인 후 링크로 배포

테스터는 iPhone에 **TestFlight 앱**을 설치하고 초대를 수락하면 설치됩니다.

---

## 명령줄(CLI) 업로드 — 선택

GUI 대신 CI/자동화로 올리려면 App Store Connect **API Key**(.p8) 발급 후:

```bash
cd ios && xcodegen generate

xcodebuild -project SimpleScan.xcodeproj -scheme SimpleScan \
  -sdk iphoneos -configuration Release \
  -archivePath build/SimpleScan.xcarchive archive

xcodebuild -exportArchive \
  -archivePath build/SimpleScan.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export

xcrun altool --upload-app -f build/export/*.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

`ExportOptions.plist` 예시(`method`는 `app-store-connect`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>여기에_팀ID</string>
  <key>uploadSymbols</key><true/>
</dict></plist>
```

> 자동화를 계속 쓸 계획이면 [Fastlane](https://fastlane.tools)의 `pilot`이 더 편합니다.

## 자주 막히는 지점

- **"No account for team" / 서명 실패** → 3단계 Team 미선택 또는 Developer Program 미가입
- **Bundle ID 중복** → 1단계에서 고유값으로 변경
- **아이콘 누락 경고** → 이미 `icon-1024.png` 포함(디자이너가 교체만 하면 됨)
- **처리 후 빌드가 안 보임** → 수출 규정 응답 대기일 수 있음(이미 자동 처리 설정됨) / 처리에 시간이 걸릴 수 있음
