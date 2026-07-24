"use client";

import { useCallback, useEffect, useState } from "react";
import { listDocumentSummaries } from "@/lib/db";
import type { DocumentSummary } from "@/lib/types";

/** 문서함 목록을 로드하고 새로고침하는 훅. */
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const summaries = await listDocumentSummaries();
      setDocuments(summaries);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문서를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { documents, loading, error, refresh };
}
