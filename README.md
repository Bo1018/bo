# 심플스캔 (SimpleScan)

카메라로 문서를 촬영하거나 이미지·PDF를 가져와 **자동 원근 보정 → 필터 → PDF/이미지
저장**까지 처리하는 웹 기반 문서 스캐너입니다. 로그인 없이 브라우저에서 바로 동작하며,
모든 처리와 저장이 사용자 기기(IndexedDB)에서 이루어집니다.

> 기획 배경과 디자인 원칙, 로드맵은 [`docs/PLANNING.md`](docs/PLANNING.md) 참고.

## 주요 기능 (MVP)

- **문서함(홈)** — 스캔한 문서를 썸네일 그리드로 최근순 표시
- **촬영 / 가져오기** — 후면 카메라 촬영, 또는 PNG·JPG 이미지·PDF 파일 가져오기(다중)
- **4점 원근 보정** — 문서 모서리를 드래그로 조정 후 반듯하게 펴기(호모그래피 warp)
- **필터** — 문서 / 원본 / 그레이 / 흑백(Otsu 이진화)
- **다중 페이지** — 한 문서에 여러 페이지 추가·순서변경·삭제
- **내보내기 / 공유** — 여러 페이지를 하나의 PDF로, 또는 페이지별 JPG·PNG 이미지로 저장,
  Web Share API로 공유
- **다크 모드** — 시스템 설정 자동 감지 + 수동 토글, 눈이 편한 소프트 팔레트

## 기술 스택

- **Next.js 16 (App Router) · React 19 · TypeScript**
- **Tailwind CSS v4** — CSS 변수 기반 디자인 토큰, `.dark` 클래스 다크모드
- **Canvas 2D** — 원근 보정·필터·회전 등 이미지 처리(순수 JS, 외부 CV 라이브러리 없음)
- **pdf-lib** — 페이지 병합 PDF 생성
- **pdf.js (pdfjs-dist)** — 가져온 PDF를 페이지 이미지로 렌더링
- **idb** — IndexedDB 로컬 저장

## 프로젝트 구조

```
app/
  page.tsx            홈(문서함)
  scan/page.tsx       스캔 플로우(촬영/가져오기 → 크롭 → 필터 → 저장)
  doc/[id]/page.tsx   문서 상세 · 내보내기
components/            공용 UI(Button, AppHeader, CropEditor, FilterBar, BottomSheet …)
lib/
  db.ts               IndexedDB 접근 계층
  types.ts            도메인 타입(Document, Page, FilterId)
  image/              원근보정 · 필터 · PDF · 내보내기 유틸
  hooks/              useDocuments · useCamera · useTheme
```

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

> 카메라 촬영은 브라우저 보안 정책상 `https` 또는 `localhost`에서만 동작합니다.

## 로드맵

- Phase 1 (현재): 촬영·보정·필터·PDF/이미지 내보내기·로컬 저장
- Phase 2: OCR 텍스트 인식(한국어·영어), 문서 검색
- Phase 3: 로그인 + 클라우드 동기화
- Phase 4: 모바일 앱 패키징

자세한 내용은 [`docs/PLANNING.md`](docs/PLANNING.md)를 확인하세요.
