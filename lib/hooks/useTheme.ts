"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "ss-theme";

const listeners = new Set<() => void>();

function isDark(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * 다크/라이트 테마 상태. 실제 소스는 <html>의 클래스(layout 인라인 스크립트가
 * 페인트 전에 설정)이며, useSyncExternalStore로 이를 구독해 FOUC·경합 없이 읽는다.
 */
export function useTheme() {
  const dark = useSyncExternalStore(
    subscribe,
    isDark,
    () => false, // 서버 스냅샷: 라이트
  );

  const toggle = useCallback(() => {
    const next: Theme = isDark() ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 저장 실패는 무시 — 세션 내에서는 정상 동작 */
    }
    listeners.forEach((l) => l());
  }, []);

  return { theme: (dark ? "dark" : "light") as Theme, toggle };
}
