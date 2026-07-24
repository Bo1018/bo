/** 문서에 적용 가능한 필터 종류. */
export type FilterId = "original" | "grayscale" | "bw" | "magic";

export const FILTER_LABELS: Record<FilterId, string> = {
  original: "원본",
  grayscale: "그레이",
  bw: "흑백",
  magic: "문서",
};

/** 스캔된 한 페이지. 이미지는 Blob으로 저장(직렬화·용량 효율). */
export interface Page {
  id: string;
  /** 보정·필터가 적용된 최종 이미지 */
  image: Blob;
  /** 사용자가 다시 편집할 수 있도록 남겨두는 원본(선택) */
  source?: Blob;
  width: number;
  height: number;
  filter: FilterId;
}

/** 여러 페이지를 묶는 문서 단위. */
export interface Document {
  id: string;
  title: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

/** 목록 화면용 경량 요약(전체 페이지 Blob을 들고 있지 않음). */
export interface DocumentSummary {
  id: string;
  title: string;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
  /** 첫 페이지 썸네일 */
  cover?: Blob;
}
