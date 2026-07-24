"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DocumentCard } from "@/components/DocumentCard";
import { CameraIcon, DocStackIcon, PlusIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui";
import { useDocuments } from "@/lib/hooks/useDocuments";

export default function HomePage() {
  const { documents, loading, error } = useDocuments();

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader title="심플스캔" actions={<ThemeToggle />} />

      <main className="mx-auto max-w-3xl px-4 py-5">
        {error ? (
          <p className="mt-16 text-center text-[14px] text-danger">{error}</p>
        ) : loading ? (
          <SkeletonGrid />
        ) : documents.length === 0 ? (
          <EmptyState />
        ) : (
          <section
            aria-label="문서함"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </section>
        )}
      </main>

      <Link
        href="/scan"
        aria-label="새 문서 스캔"
        className="fixed bottom-6 left-1/2 z-30 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-fg shadow-[var(--shadow-pop)] transition-transform duration-150 active:scale-95"
      >
        <CameraIcon width={22} height={22} />
        스캔하기
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-24 flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-soft text-accent">
        <DocStackIcon width={38} height={38} />
      </div>
      <h2 className="mt-5 text-[18px] font-semibold">아직 문서가 없어요</h2>
      <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted">
        아래 <span className="font-medium text-ink">스캔하기</span> 버튼을 눌러
        문서를 촬영하거나 이미지·PDF를 가져와 시작하세요.
      </p>
      <Link
        href="/scan"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-[15px] font-medium transition-colors duration-150 active:bg-surface-2"
      >
        <PlusIcon width={20} height={20} />첫 문서 만들기
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2"
        />
      ))}
    </div>
  );
}
