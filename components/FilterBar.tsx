"use client";

import { FILTER_LABELS, type FilterId } from "@/lib/types";

const ORDER: FilterId[] = ["magic", "original", "grayscale", "bw"];

interface FilterBarProps {
  value: FilterId;
  onChange: (filter: FilterId) => void;
}

/** 문서 필터 선택 칩. 가로 스크롤로 좁은 화면 대응. */
export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-1">
      {ORDER.map((id) => {
        const active = id === value;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={[
              "h-10 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors duration-150",
              active
                ? "bg-accent text-accent-fg"
                : "border border-border bg-surface text-ink active:bg-surface-2",
            ].join(" ")}
          >
            {FILTER_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
