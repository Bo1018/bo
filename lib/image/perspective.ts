import { estimateOutputSize, type Point, type Quad } from "@/lib/image/geometry";

/**
 * 8x8 선형계를 가우스 소거법으로 풀어 dest→src 호모그래피 계수를 구한다.
 * (역매핑: 출력 픽셀마다 원본 좌표를 찾는 방식이라 dest를 입력으로 둔다.)
 */
function solveHomography(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point],
): number[] {
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x, y } = dst[i];
    const { x: u, y: v } = src[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  // 부분 피벗팅을 적용한 가우스 소거.
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let r = col + 1; r < 8; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];

    const p = a[col][col] || 1e-9;
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const factor = a[r][col] / p;
      for (let c = col; c < 8; c++) a[r][c] -= factor * a[col][c];
      b[r] -= factor * b[col];
    }
  }

  const h = new Array(9);
  for (let i = 0; i < 8; i++) h[i] = b[i] / (a[i][i] || 1e-9);
  h[8] = 1;
  return h;
}

function toPixelQuad(quad: Quad, w: number, h: number): [Point, Point, Point, Point] {
  return quad.map((p) => ({ x: p.x * w, y: p.y * h })) as [
    Point,
    Point,
    Point,
    Point,
  ];
}

/**
 * 4점 원근 보정. 원본 캔버스와 정규화 quad를 받아 반듯하게 편 새 캔버스를 반환.
 * 출력 픽셀 → 원본 좌표 역매핑 + 쌍선형 보간으로 계단 현상을 줄인다.
 */
export function warpPerspective(
  source: HTMLCanvasElement | OffscreenCanvas,
  quad: Quad,
): HTMLCanvasElement {
  const sw = source.width;
  const sh = source.height;
  const srcCtx = (source as HTMLCanvasElement).getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
  const srcData = srcCtx.getImageData(0, 0, sw, sh).data;

  const { width: dw, height: dh } = estimateOutputSize(quad, sw, sh);

  const srcPts = toPixelQuad(quad, sw, sh);
  const dstPts: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: dw, y: 0 },
    { x: dw, y: dh },
    { x: 0, y: dh },
  ];
  const h = solveHomography(srcPts, dstPts);

  const out = document.createElement("canvas");
  out.width = dw;
  out.height = dh;
  const outCtx = out.getContext("2d") as CanvasRenderingContext2D;
  const outImg = outCtx.createImageData(dw, dh);
  const outData = outImg.data;

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const denom = h[6] * x + h[7] * y + h[8];
      const sx = (h[0] * x + h[1] * y + h[2]) / denom;
      const sy = (h[3] * x + h[4] * y + h[5]) / denom;

      const di = (y * dw + x) * 4;
      if (sx < 0 || sy < 0 || sx >= sw - 1 || sy >= sh - 1) {
        outData[di + 3] = 255;
        outData[di] = outData[di + 1] = outData[di + 2] = 255;
        continue;
      }

      // 쌍선형 보간
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sw * 4;
      const i11 = i01 + 4;

      for (let c = 0; c < 3; c++) {
        const top = srcData[i00 + c] * (1 - fx) + srcData[i10 + c] * fx;
        const bot = srcData[i01 + c] * (1 - fx) + srcData[i11 + c] * fx;
        outData[di + c] = top * (1 - fy) + bot * fy;
      }
      outData[di + 3] = 255;
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  return out;
}
