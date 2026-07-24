"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BlobImage } from "@/components/BlobImage";
import { CropEditor } from "@/components/CropEditor";
import { FilterBar } from "@/components/FilterBar";
import {
  CameraIcon,
  CheckIcon,
  FileIcon,
  RotateIcon,
  TrashIcon,
} from "@/components/icons";
import { Button, IconButton } from "@/components/ui";
import { saveDocument } from "@/lib/db";
import {
  applyFilter,
  blobToImage,
  imageToCanvas,
  rotateCanvas,
} from "@/lib/image/canvas";
import { DEFAULT_QUAD, type Quad } from "@/lib/image/geometry";
import { pdfToCanvases } from "@/lib/image/pdf";
import { buildPage, canvasToUrl, warp } from "@/lib/image/pipeline";
import { useCamera } from "@/lib/hooks/useCamera";
import type { FilterId, Page } from "@/lib/types";
import { defaultDocTitle, uid } from "@/lib/utils";

type Step = "capture" | "crop" | "filter" | "save";

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // 크롭 단계 작업 대상
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [quad, setQuad] = useState<Quad>(DEFAULT_QUAD);

  // 필터 단계 작업 대상
  const warpedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [filter, setFilter] = useState<FilterId>("magic");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [title, setTitle] = useState("");

  const { videoRef, state: cameraState, capture } = useCamera(step === "capture");

  // ── 촬영 ──────────────────────────────────────────────
  const beginCrop = useCallback((canvas: HTMLCanvasElement) => {
    sourceCanvasRef.current = canvas;
    setSourceUrl(canvasToUrl(canvas));
    setQuad(DEFAULT_QUAD);
    setStep("crop");
  }, []);

  const onShutter = () => {
    const frame = capture();
    if (frame) beginCrop(frame);
  };

  // ── 가져오기 (이미지 / PDF, 다중) ──────────────────────
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setBusy("가져오는 중…");
    try {
      const imported: Page[] = [];
      for (const file of files) {
        if (file.type === "application/pdf") {
          const canvases = await pdfToCanvases(file);
          for (const c of canvases) {
            imported.push(await buildPage(c, "original"));
          }
        } else if (file.type.startsWith("image/")) {
          const img = await blobToImage(file);
          const canvas = imageToCanvas(img);
          imported.push(await buildPage(canvas, "original"));
        }
      }
      if (imported.length > 0) setPages((prev) => [...prev, ...imported]);
    } catch {
      alert("일부 파일을 가져오지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };

  // ── 크롭 → 필터 ───────────────────────────────────────
  const onCropNext = () => {
    const source = sourceCanvasRef.current;
    if (!source) return;
    const warped = warp(source, quad);
    warpedCanvasRef.current = warped;
    setFilter("magic");
    setPreviewUrl(canvasToUrl(warped));
    setStep("filter");
  };

  const onRotateSource = () => {
    const source = sourceCanvasRef.current;
    if (!source) return;
    const rotated = rotateCanvas(source, 90);
    sourceCanvasRef.current = rotated;
    setSourceUrl(canvasToUrl(rotated));
    setQuad(DEFAULT_QUAD);
  };

  // 필터 변경 시 미리보기 갱신
  const onChangeFilter = (next: FilterId) => {
    setFilter(next);
    const warped = warpedCanvasRef.current;
    if (!warped) return;
    // 미리보기는 CSS가 아닌 실제 픽셀 결과로 보여준다.
    setPreviewUrl(canvasToUrl(applyFilter(warped, next)));
  };

  // ── 필터 → 페이지 추가 ────────────────────────────────
  const onAddPage = async () => {
    const warped = warpedCanvasRef.current;
    const source = sourceCanvasRef.current;
    if (!warped) return;
    setBusy("페이지 추가 중…");
    try {
      const page = await buildPage(warped, filter, source ?? undefined);
      setPages((prev) => [...prev, page]);
      setStep("capture");
    } finally {
      setBusy(null);
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  // ── 저장 ──────────────────────────────────────────────
  const onSave = async () => {
    if (pages.length === 0) return;
    setBusy("저장 중…");
    try {
      const now = Date.now();
      const id = uid();
      await saveDocument({
        id,
        title: title.trim() || defaultDocTitle(),
        pages,
        createdAt: now,
        updatedAt: now,
      });
      router.replace(`/doc/${id}`);
    } catch {
      setBusy(null);
      alert("저장에 실패했습니다.");
    }
  };

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {step === "capture" && (
        <CaptureStep
          videoRef={videoRef}
          cameraState={cameraState}
          pages={pages}
          busy={busy}
          onShutter={onShutter}
          onImport={onImport}
          onRemovePage={removePage}
          onDone={() => {
            setTitle(defaultDocTitle());
            setStep("save");
          }}
          onBack={() => router.push("/")}
        />
      )}

      {step === "crop" && (
        <CropStep
          imageUrl={sourceUrl}
          quad={quad}
          onQuadChange={setQuad}
          onReset={() => setQuad(DEFAULT_QUAD)}
          onRotate={onRotateSource}
          onNext={onCropNext}
          onBack={() => setStep("capture")}
        />
      )}

      {step === "filter" && (
        <FilterStep
          previewUrl={previewUrl}
          filter={filter}
          busy={busy}
          onChangeFilter={onChangeFilter}
          onAdd={onAddPage}
          onBack={() => setStep("crop")}
        />
      )}

      {step === "save" && (
        <SaveStep
          title={title}
          pages={pages}
          busy={busy}
          onTitleChange={setTitle}
          onSave={onSave}
          onBack={() => setStep("capture")}
        />
      )}
    </div>
  );
}

// ── Capture ─────────────────────────────────────────────
function CaptureStep({
  videoRef,
  cameraState,
  pages,
  busy,
  onShutter,
  onImport,
  onRemovePage,
  onDone,
  onBack,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraState: string;
  pages: Page[];
  busy: string | null;
  onShutter: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePage: (id: string) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const cameraLive = cameraState === "ready";
  return (
    <>
      <AppHeader title="스캔" back onBack={onBack} />
      <div className="flex flex-1 flex-col">
        <div className="relative mx-auto w-full max-w-3xl flex-1">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${cameraLive ? "opacity-100" : "opacity-0"}`}
            />
            {!cameraLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/90">
                <CameraIcon width={40} height={40} />
                <p className="text-[14px]">
                  {cameraState === "starting"
                    ? "카메라를 준비하고 있어요…"
                    : cameraState === "denied"
                      ? "카메라 접근이 허용되지 않았어요. 아래에서 파일을 가져오세요."
                      : cameraState === "unsupported"
                        ? "이 브라우저는 카메라를 지원하지 않아요. 파일을 가져오세요."
                        : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 추가된 페이지 필름스트립 */}
        {pages.length > 0 && (
          <div className="no-scrollbar mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto px-4 py-3">
            {pages.map((p, i) => (
              <div key={p.id} className="relative shrink-0">
                <BlobImage
                  blob={p.image}
                  alt={`${i + 1}페이지`}
                  className="h-20 w-16 rounded-lg border border-border object-cover"
                />
                <button
                  aria-label={`${i + 1}페이지 삭제`}
                  onClick={() => onRemovePage(p.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 컨트롤 */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-2">
          <div className="flex items-center justify-between gap-4">
            <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl text-muted active:bg-surface-2">
              <FileIcon width={24} height={24} />
              <span className="text-[11px]">가져오기</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={onImport}
                className="hidden"
              />
            </label>

            <button
              aria-label="촬영"
              onClick={onShutter}
              disabled={!cameraLive || !!busy}
              className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-accent/30 disabled:opacity-40"
            >
              <span className="h-14 w-14 rounded-full bg-accent transition-transform duration-150 active:scale-90" />
            </button>

            <button
              onClick={onDone}
              disabled={pages.length === 0 || !!busy}
              className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-accent disabled:text-muted disabled:opacity-40"
            >
              <CheckIcon width={24} height={24} />
              <span className="text-[11px]">완료 {pages.length > 0 && `(${pages.length})`}</span>
            </button>
          </div>
          {busy && (
            <p className="mt-3 text-center text-[13px] text-muted">{busy}</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Crop ────────────────────────────────────────────────
function CropStep({
  imageUrl,
  quad,
  onQuadChange,
  onReset,
  onRotate,
  onNext,
  onBack,
}: {
  imageUrl: string;
  quad: Quad;
  onQuadChange: (q: Quad) => void;
  onReset: () => void;
  onRotate: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <AppHeader
        title="영역 조정"
        onBack={onBack}
        actions={
          <IconButton label="90도 회전" onClick={onRotate}>
            <RotateIcon />
          </IconButton>
        }
      />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md">
            {imageUrl && (
              <CropEditor imageUrl={imageUrl} quad={quad} onChange={onQuadChange} />
            )}
            <p className="mt-3 text-center text-[13px] text-muted">
              네 모서리를 문서 꼭짓점에 맞춰 주세요.
            </p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md gap-3 px-4 pb-6">
          <Button variant="secondary" onClick={onReset} className="flex-1">
            전체 선택
          </Button>
          <Button variant="primary" onClick={onNext} className="flex-1" icon={<CheckIcon width={20} height={20} />}>
            다음
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Filter ──────────────────────────────────────────────
function FilterStep({
  previewUrl,
  filter,
  busy,
  onChangeFilter,
  onAdd,
  onBack,
}: {
  previewUrl: string;
  filter: FilterId;
  busy: string | null;
  onChangeFilter: (f: FilterId) => void;
  onAdd: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <AppHeader title="필터" onBack={onBack} />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="보정 결과 미리보기"
                className="mx-auto max-h-[60vh] w-auto rounded-xl border border-border shadow-[var(--shadow-card)]"
              />
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md px-4 pb-6">
          <FilterBar value={filter} onChange={onChangeFilter} />
          <Button
            variant="primary"
            block
            onClick={onAdd}
            disabled={!!busy}
            className="mt-3"
            icon={<CheckIcon width={20} height={20} />}
          >
            {busy ?? "페이지 추가"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Save ────────────────────────────────────────────────
function SaveStep({
  title,
  pages,
  busy,
  onTitleChange,
  onSave,
  onBack,
}: {
  title: string;
  pages: Page[];
  busy: string | null;
  onTitleChange: (t: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <AppHeader title="저장" onBack={onBack} />
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <label className="text-[13px] font-medium text-muted" htmlFor="doc-title">
          문서 이름
        </label>
        <input
          id="doc-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={defaultDocTitle()}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus:border-accent"
        />

        <p className="mt-6 text-[13px] font-medium text-muted">
          {pages.length}장의 페이지
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {pages.map((p, i) => (
            <BlobImage
              key={p.id}
              blob={p.image}
              alt={`${i + 1}페이지`}
              className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-6">
        <Button
          variant="primary"
          block
          onClick={onSave}
          disabled={!!busy}
          icon={<CheckIcon width={20} height={20} />}
        >
          {busy ?? "문서 저장"}
        </Button>
      </div>
    </>
  );
}
