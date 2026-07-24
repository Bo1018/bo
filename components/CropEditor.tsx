"use client";

import { useCallback, useRef } from "react";
import type { Point, Quad } from "@/lib/image/geometry";

interface CropEditorProps {
  /** 표시용 이미지 URL(원본) */
  imageUrl: string;
  quad: Quad;
  onChange: (quad: Quad) => void;
}

const CORNER_LABELS = ["좌상단", "우상단", "우하단", "좌하단"];

/**
 * 4점 문서 경계 조정 UI. 각 모서리 핸들을 드래그해 정규화 quad를 갱신한다.
 * 포인터 이벤트로 터치·마우스를 함께 지원.
 */
export function CropEditor({ imageUrl, quad, onChange }: CropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCorner = useRef<number | null>(null);

  const updateCorner = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      const idx = activeCorner.current;
      if (!el || idx == null) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const next = quad.map((p, i) => (i === idx ? { x, y } : p)) as Quad;
      onChange(next);
    },
    [quad, onChange],
  );

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeCorner.current = idx;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeCorner.current == null) return;
    updateCorner(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    activeCorner.current = null;
  };

  const points = quad.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none overflow-hidden rounded-xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="스캔할 문서" className="block w-full" draggable={false} />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="crop-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <polygon points={points} fill="black" />
          </mask>
        </defs>
        {/* 바깥 영역 딤 처리 */}
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="rgba(10,12,15,0.5)"
          mask="url(#crop-mask)"
        />
        <polygon
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {quad.map((p: Point, idx) => (
        <button
          key={idx}
          aria-label={`${CORNER_LABELS[idx]} 모서리`}
          onPointerDown={handlePointerDown(idx)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full"
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
        >
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-accent bg-white shadow-md" />
        </button>
      ))}
    </div>
  );
}
