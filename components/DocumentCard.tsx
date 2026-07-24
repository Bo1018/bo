"use client";

import Link from "next/link";
import { BlobImage } from "@/components/BlobImage";
import { DocStackIcon } from "@/components/icons";
import type { DocumentSummary } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function DocumentCard({ doc }: { doc: DocumentSummary }) {
  return (
    <Link
      href={`/doc/${doc.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-transform duration-150 active:scale-[0.98]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        {doc.cover ? (
          <BlobImage
            blob={doc.cover}
            alt={doc.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <DocStackIcon width={34} height={34} />
          </div>
        )}
        {doc.pageCount > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-medium text-white backdrop-blur-sm">
            {doc.pageCount}장
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-[14px] font-medium">{doc.title}</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {formatRelativeTime(doc.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
