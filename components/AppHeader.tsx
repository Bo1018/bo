"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";

interface AppHeaderProps {
  title: ReactNode;
  /** 뒤로가기 버튼 표시 여부. 문자열이면 해당 경로로 이동. */
  back?: boolean | string;
  /** 지정 시 기본 동작 대신 이 핸들러를 호출(플로우 내 단계 이동 등). */
  onBack?: () => void;
  /** 우측 액션 영역 */
  actions?: ReactNode;
  /** 제목 아래 보조 텍스트 */
  subtitle?: string;
}

export function AppHeader({ title, back, onBack, actions, subtitle }: AppHeaderProps) {
  const router = useRouter();
  const showBack = onBack != null || (back != null && back !== false);

  const handleBack = () => {
    if (onBack) return onBack();
    if (typeof back === "string") return router.push(back);
    router.back();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-1 px-2 sm:px-4">
        {showBack && (
          <IconButton label="뒤로" onClick={handleBack}>
            <ChevronLeftIcon />
          </IconButton>
        )}
        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-[17px] font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[13px] text-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
