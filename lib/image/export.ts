import { blobToCanvas, canvasToBlob } from "@/lib/image/canvas";
import { downloadBlob, pagesToPdf } from "@/lib/image/pdf";
import type { Document, Page } from "@/lib/types";

/** 파일명에 안전하지 않은 문자 정리. */
function safeName(title: string): string {
  return title.replace(/[\\/:*?"<>|]+/g, "_").trim() || "문서";
}

/** 문서를 PDF Blob으로. */
export async function documentToPdf(doc: Document): Promise<{ blob: Blob; filename: string }> {
  const blob = await pagesToPdf(doc.pages);
  return { blob, filename: `${safeName(doc.title)}.pdf` };
}

/** 한 페이지를 지정 형식 이미지 Blob으로 변환. */
export async function pageToImage(
  page: Page,
  format: "jpeg" | "png",
): Promise<Blob> {
  if (format === "jpeg" && page.image.type === "image/jpeg") return page.image;
  const canvas = await blobToCanvas(page.image);
  return canvasToBlob(canvas, format === "png" ? "image/png" : "image/jpeg", 0.92);
}

/** 모든 페이지를 개별 이미지 파일로 순차 다운로드. */
export async function downloadImages(
  doc: Document,
  format: "jpeg" | "png",
): Promise<void> {
  const base = safeName(doc.title);
  const ext = format === "png" ? "png" : "jpg";
  for (let i = 0; i < doc.pages.length; i++) {
    const blob = await pageToImage(doc.pages[i], format);
    const name =
      doc.pages.length === 1 ? `${base}.${ext}` : `${base}_${i + 1}.${ext}`;
    downloadBlob(blob, name);
    // 연속 다운로드가 브라우저에 막히지 않도록 약간의 간격.
    if (i < doc.pages.length - 1) await new Promise((r) => setTimeout(r, 250));
  }
}

/** Web Share API로 파일 공유 가능 여부. */
export function canShareFiles(files: File[]): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  );
}

/** 파일 공유 시도. 미지원이면 false 반환(호출부에서 다운로드로 폴백). */
export async function shareFiles(
  files: File[],
  title: string,
): Promise<boolean> {
  if (!canShareFiles(files)) return false;
  try {
    await navigator.share({ files, title });
    return true;
  } catch {
    // 사용자가 취소한 경우도 여기로 옴 — 폴백하지 않도록 true 취급.
    return true;
  }
}

export { downloadBlob };
