"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BlobImage } from "@/components/BlobImage";
import { BottomSheet } from "@/components/BottomSheet";
import {
  DownloadIcon,
  FileIcon,
  ImageIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { Button, IconButton } from "@/components/ui";
import { deleteDocument, getDocument, saveDocument } from "@/lib/db";
import {
  documentToPdf,
  downloadBlob,
  downloadImages,
  shareFiles,
} from "@/lib/image/export";
import type { Document } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getDocument(id)
      .then((d) => {
        if (alive) {
          setDoc(d ?? null);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const persist = useCallback(async (next: Document) => {
    next.updatedAt = Date.now();
    setDoc({ ...next });
    await saveDocument(next);
  }, []);

  const rename = async () => {
    if (!doc) return;
    const name = window.prompt("문서 이름", doc.title);
    if (name == null) return;
    await persist({ ...doc, title: name.trim() || doc.title });
  };

  const movePage = async (index: number, dir: -1 | 1) => {
    if (!doc) return;
    const target = index + dir;
    if (target < 0 || target >= doc.pages.length) return;
    const pages = [...doc.pages];
    [pages[index], pages[target]] = [pages[target], pages[index]];
    await persist({ ...doc, pages });
  };

  const removePage = async (pageId: string) => {
    if (!doc) return;
    if (!window.confirm("이 페이지를 삭제할까요?")) return;
    const pages = doc.pages.filter((p) => p.id !== pageId);
    if (pages.length === 0) {
      await deleteDocument(doc.id);
      router.replace("/");
      return;
    }
    await persist({ ...doc, pages });
  };

  const removeDocument = async () => {
    if (!doc) return;
    if (!window.confirm(`'${doc.title}' 문서를 삭제할까요?`)) return;
    await deleteDocument(doc.id);
    router.replace("/");
  };

  // ── 내보내기 ──────────────────────────────────────────
  const exportPdf = async () => {
    if (!doc) return;
    setBusy("PDF 생성 중…");
    try {
      const { blob, filename } = await documentToPdf(doc);
      downloadBlob(blob, filename);
      setExportOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const sharePdf = async () => {
    if (!doc) return;
    setBusy("공유 준비 중…");
    try {
      const { blob, filename } = await documentToPdf(doc);
      const file = new File([blob], filename, { type: "application/pdf" });
      const shared = await shareFiles([file], doc.title);
      if (!shared) downloadBlob(blob, filename);
      setExportOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const exportImages = async (format: "jpeg" | "png") => {
    if (!doc) return;
    setBusy("이미지 저장 중…");
    try {
      await downloadImages(doc, format);
      setExportOpen(false);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh">
        <AppHeader title="문서" back="/" />
        <div className="mx-auto max-w-md space-y-3 p-4">
          <div className="aspect-[3/4] animate-pulse rounded-xl bg-surface-2" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-dvh">
        <AppHeader title="문서" back="/" />
        <div className="flex flex-col items-center py-24 text-center">
          <p className="text-[15px] text-muted">문서를 찾을 수 없습니다.</p>
          <Button className="mt-4" onClick={() => router.replace("/")}>
            문서함으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader
        title={doc.title}
        subtitle={`${doc.pages.length}장 · ${formatRelativeTime(doc.updatedAt)}`}
        back="/"
        actions={
          <>
            <IconButton label="이름 변경" onClick={rename}>
              <PencilIcon width={22} height={22} />
            </IconButton>
            <IconButton label="문서 삭제" variant="danger" onClick={removeDocument}>
              <TrashIcon width={22} height={22} />
            </IconButton>
          </>
        }
      />

      <main className="mx-auto max-w-md space-y-4 p-4">
        {doc.pages.map((page, i) => (
          <div
            key={page.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
          >
            <BlobImage
              blob={page.image}
              alt={`${i + 1}페이지`}
              className="w-full object-contain"
            />
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="text-[13px] text-muted">{i + 1} / {doc.pages.length}</span>
              <div className="flex items-center gap-0.5">
                <IconButton
                  label="위로"
                  onClick={() => movePage(i, -1)}
                  className="h-10 w-10"
                >
                  <span aria-hidden className="text-lg">↑</span>
                </IconButton>
                <IconButton
                  label="아래로"
                  onClick={() => movePage(i, 1)}
                  className="h-10 w-10"
                >
                  <span aria-hidden className="text-lg">↓</span>
                </IconButton>
                <IconButton
                  label="페이지 삭제"
                  variant="danger"
                  onClick={() => removePage(page.id)}
                  className="h-10 w-10"
                >
                  <TrashIcon width={20} height={20} />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* 내보내기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button
            variant="primary"
            block
            onClick={() => setExportOpen(true)}
            icon={<ShareIcon width={20} height={20} />}
          >
            내보내기 · 공유
          </Button>
        </div>
      </div>

      <BottomSheet
        open={exportOpen}
        title="내보내기"
        onClose={() => !busy && setExportOpen(false)}
      >
        <div className="space-y-2">
          <ExportRow
            icon={<ShareIcon width={22} height={22} />}
            label="PDF 공유"
            hint="다른 앱으로 바로 공유"
            onClick={sharePdf}
            disabled={!!busy}
          />
          <ExportRow
            icon={<FileIcon width={22} height={22} />}
            label="PDF로 저장"
            hint={`${doc.pages.length}장을 하나의 PDF로`}
            onClick={exportPdf}
            disabled={!!busy}
          />
          <ExportRow
            icon={<ImageIcon width={22} height={22} />}
            label="JPG 이미지로 저장"
            hint="페이지별 개별 이미지"
            onClick={() => exportImages("jpeg")}
            disabled={!!busy}
          />
          <ExportRow
            icon={<DownloadIcon width={22} height={22} />}
            label="PNG 이미지로 저장"
            hint="페이지별 개별 이미지"
            onClick={() => exportImages("png")}
            disabled={!!busy}
          />
        </div>
        {busy && (
          <p className="mt-3 text-center text-[13px] text-muted">{busy}</p>
        )}
      </BottomSheet>
    </div>
  );
}

function ExportRow({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors duration-150 active:bg-surface-2 disabled:opacity-40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-[13px] text-muted">{hint}</span>
      </span>
    </button>
  );
}
