"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "@/lib/hooks/useTheme";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90 active:opacity-80",
  secondary:
    "bg-surface text-ink border border-border hover:bg-surface-2 active:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2 active:bg-surface-2",
  danger: "bg-transparent text-danger hover:bg-danger/10 active:bg-danger/15",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = "secondary",
  icon,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium",
        "h-12 min-h-12 select-none transition-[opacity,background-color] duration-150",
        "disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variants[variant],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

/** 최소 48×48 터치 타깃을 보장하는 아이콘 전용 버튼. */
export function IconButton({
  label,
  variant = "ghost",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-12 w-12 items-center justify-center rounded-xl",
        "transition-[opacity,background-color] duration-150 select-none",
        "disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton
      label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={toggle}
    >
      {theme === "dark" ? (
        <SunIcon width={22} height={22} />
      ) : (
        <MoonIcon width={22} height={22} />
      )}
    </IconButton>
  );
}
