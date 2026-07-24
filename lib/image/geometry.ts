/** 정규화 좌표(0~1)로 표현한 한 점. 이미지 크기와 무관하게 저장·전송. */
export interface Point {
  x: number;
  y: number;
}

/** 시계방향: 좌상, 우상, 우하, 좌하. */
export type Quad = [Point, Point, Point, Point];

/** 문서 경계 후보를 못 찾았을 때의 기본 사각형(가장자리에서 살짝 안쪽). */
export const DEFAULT_QUAD: Quad = [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];

function dist(a: Point, b: Point, w: number, h: number): number {
  const dx = (a.x - b.x) * w;
  const dy = (a.y - b.y) * h;
  return Math.hypot(dx, dy);
}

/**
 * 정규화 quad와 원본 픽셀 크기로부터 보정 결과의 출력 크기를 추정.
 * 마주보는 변의 최댓값을 취해 문서가 잘리지 않도록 한다.
 */
export function estimateOutputSize(
  quad: Quad,
  srcW: number,
  srcH: number,
  maxSide = 1600,
): { width: number; height: number } {
  const [tl, tr, br, bl] = quad;
  const widthPx = Math.max(dist(tl, tr, srcW, srcH), dist(bl, br, srcW, srcH));
  const heightPx = Math.max(dist(tl, bl, srcW, srcH), dist(tr, br, srcW, srcH));

  let w = Math.max(1, Math.round(widthPx));
  let h = Math.max(1, Math.round(heightPx));

  const longest = Math.max(w, h);
  if (longest > maxSide) {
    const s = maxSide / longest;
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }
  return { width: w, height: h };
}
