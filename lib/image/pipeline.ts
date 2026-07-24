import { applyFilter, canvasToBlob } from "@/lib/image/canvas";
import type { Quad } from "@/lib/image/geometry";
import { warpPerspective } from "@/lib/image/perspective";
import type { FilterId, Page } from "@/lib/types";
import { uid } from "@/lib/utils";

/** 캔버스를 미리보기용 data URL로. */
export function canvasToUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** 원본 캔버스 + quad → 원근 보정된 캔버스. */
export function warp(source: HTMLCanvasElement, quad: Quad): HTMLCanvasElement {
  return warpPerspective(source, quad);
}

/**
 * 보정된 캔버스와 필터로 최종 Page 생성.
 * source 캔버스(보정 전)를 함께 저장해 추후 재편집을 대비.
 */
export async function buildPage(
  warped: HTMLCanvasElement,
  filter: FilterId,
  source?: HTMLCanvasElement,
): Promise<Page> {
  const filtered = applyFilter(warped, filter);
  const image = await canvasToBlob(filtered, "image/jpeg", 0.9);
  const sourceBlob = source
    ? await canvasToBlob(source, "image/jpeg", 0.85)
    : undefined;

  return {
    id: uid(),
    image,
    source: sourceBlob,
    width: filtered.width,
    height: filtered.height,
    filter,
  };
}
