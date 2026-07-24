#!/usr/bin/env bash
#
# 심플스캔 iOS — 맥에서 프로젝트 생성 + 시뮬레이터용 컴파일 검증.
# 사용법: cd ios && ./build.sh
#
# 이 스크립트는 서명 없이 iOS 시뮬레이터 SDK로 전체 Swift를 컴파일해
# 실제 빌드 오류를 빠르게 확인하는 용도입니다(실기기 서명 불필요).
set -euo pipefail
cd "$(dirname "$0")"

echo "▶︎ 1/3  XcodeGen 확인…"
if ! command -v xcodegen >/dev/null 2>&1; then
  echo "   xcodegen 미설치 → 설치를 시도합니다."
  if command -v brew >/dev/null 2>&1; then
    brew install xcodegen
  else
    echo "   ✗ Homebrew가 없습니다. https://brew.sh 설치 후 다시 실행하거나,"
    echo "     'mint install yonaskolb/xcodegen' 등으로 xcodegen을 설치하세요."
    exit 1
  fi
fi

echo "▶︎ 2/3  Xcode 프로젝트 생성(xcodegen)…"
xcodegen generate

echo "▶︎ 3/3  시뮬레이터용 컴파일(서명 없이)…"
set -o pipefail
xcodebuild \
  -project SimpleScan.xcodeproj \
  -scheme SimpleScan \
  -sdk iphonesimulator \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build

echo ""
echo "✅ 컴파일 성공 — Swift 코드에 빌드 오류가 없습니다."
echo "   실기기 실행: open SimpleScan.xcodeproj → Team 서명 설정 → 기기 선택 후 Run"
