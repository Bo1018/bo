import type { FilterId } from "@/lib/types";

/** Blob → HTMLImageElement (objectURL 로드 후 정리). */
export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    img.src = url;
  });
}

/**
 * 이미지를 캔버스로 그린다. 긴 변이 maxSide를 넘으면 비율 유지하며 축소
 * (처리 속도·저장 용량 최적화).
 */
export function imageToCanvas(
  img: HTMLImageElement,
  maxSide = 2200,
): HTMLCanvasElement {
  let { naturalWidth: w, naturalHeight: h } = img;
  const longest = Math.max(w, h);
  if (longest > maxSide) {
    const s = maxSide / longest;
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export async function blobToCanvas(blob: Blob, maxSide?: number) {
  const img = await blobToImage(blob);
  return imageToCanvas(img, maxSide);
}

/** 캔버스를 지정 형식의 Blob으로 인코딩. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality = 0.9,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("이미지 인코딩에 실패했습니다.")),
      type,
      quality,
    );
  });
}

/**
 * 문서 필터를 픽셀 단위로 적용해 새 캔버스를 반환.
 * - grayscale: 휘도 변환
 * - bw: Otsu 임계값 기반 이진화
 * - magic: 대비·밝기를 끌어올린 "문서" 모드(배경 흰색화)
 */
export function applyFilter(
  source: HTMLCanvasElement,
  filter: FilterId,
): HTMLCanvasElement {
  if (filter === "original") return source;

  const w = source.width;
  const h = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const srcCtx = source.getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
  const imageData = srcCtx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const lum = (i: number) =>
    0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

  if (filter === "grayscale") {
    for (let i = 0; i < d.length; i += 4) {
      const g = lum(i);
      d[i] = d[i + 1] = d[i + 2] = g;
    }
  } else if (filter === "bw") {
    const threshold = otsuThreshold(d);
    for (let i = 0; i < d.length; i += 4) {
      const v = lum(i) >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  } else if (filter === "magic") {
    // 밝은 영역을 흰 배경으로 밀어 올리고 대비를 강화.
    const contrast = 1.35;
    const brightness = 12;
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = d[i + c];
        v = (v - 128) * contrast + 128 + brightness;
        d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Otsu 방법으로 최적 이진화 임계값 계산. */
function otsuThreshold(d: Uint8ClampedArray): number {
  const hist = new Array(256).fill(0);
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    hist[g]++;
    total++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
}

/** 캔버스를 90도 단위로 회전한 새 캔버스 반환. */
export function rotateCanvas(
  source: HTMLCanvasElement,
  degrees: 90 | 180 | 270,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const swap = degrees === 90 || degrees === 270;
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}
