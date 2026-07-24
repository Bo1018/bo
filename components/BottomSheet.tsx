"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { XIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** 하단에서 올라오는 모달 시트. 배경 딤 클릭 또는 Esc로 닫힘. */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface p-4 shadow-[var(--shadow-pop)] sm:rounded-2xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <IconButton label="닫기" onClick={onClose}>
            <XIcon width={20} height={20} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
