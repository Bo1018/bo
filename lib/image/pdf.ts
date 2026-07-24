import { PDFDocument } from "pdf-lib";
import type { Page } from "@/lib/types";
import { blobToCanvas, canvasToBlob } from "@/lib/image/canvas";

/**
 * 페이지들을 한 개의 PDF로 병합. 각 이미지를 JPEG로 정규화해 삽입하고
 * 페이지 크기를 이미지 종횡비에 맞춘다.
 */
export async function pagesToPdf(pages: Page[]): Promise<Blob> {
  const pdf = await PDFDocument.create();

  for (const page of pages) {
    // 저장된 Blob이 PNG일 수도 있어 JPEG로 통일(용량·호환성).
    const canvas = await blobToCanvas(page.image);
    const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.9);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const embedded = await pdf.embedJpg(bytes);

    const pdfPage = pdf.addPage([embedded.width, embedded.height]);
    pdfPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  const data = await pdf.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/**
 * PDF 파일을 페이지별 이미지(캔버스)로 렌더링해 가져오기.
 * pdf.js는 무겁고 워커가 필요하므로 동적 import로 지연 로드한다.
 */
export async function pdfToCanvases(
  file: Blob,
  scale = 2,
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import("pdfjs-dist");
  // 번들러가 워커를 별도 청크로 처리하도록 URL 지정.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

/** Blob 다운로드 트리거. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
